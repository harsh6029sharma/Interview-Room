import { groq } from "../lib/llm"
import { prisma } from "../lib/prisma"
import { ApiError } from "../utils/ApiError"

interface InterviewContext {
    candidateName: string | null
    questions: Array<{
        title: string,
        difficulty: string,
        status: string,
        finalCode: string | null,
        language: string | null,
        passCount: number,
        totalCount: number
    }>
    chatMessages: Array<{
        senderRole: string
        senderName: string | null
        message: string
    }>
}

interface AISummaryResult {
    summaryText: string
    strengths: string[]
    weaknesses: string[]
    recommendation: string
}

async function buildInterviewContext(interviewId: string): Promise<InterviewContext> {
    const interview = await prisma.interview.findUnique({
        where: { id: interviewId },
        include: {
            interviewQuestions: {
                include: {
                    question: true,
                    codeSession: true,
                    submissions: {
                        orderBy: { submittedAt: "desc" },
                        take: 1,
                    },
                },
                orderBy: { order: "asc" },
            },
            chatMessages: {
                orderBy: { sentAt: "asc" },
            },
        },
    })

    if (!interview) throw new ApiError(404, "Interview not found")

    return {
        candidateName: interview.candidateName,
        questions: interview.interviewQuestions.map((iq) => {
            const latestSubmission = iq.submissions[0] ?? null
            return {
                title: iq.question.title,
                difficulty: iq.question.difficulty,
                status: iq.status,
                finalCode: iq.codeSession?.currentCode ?? null,
                language: iq.codeSession?.language ?? null,
                passCount: latestSubmission?.passCount ?? 0,
                totalCount: latestSubmission?.totalCount ?? 0,
            }
        }),
        chatMessages: interview.chatMessages.map((msg) => ({
            senderRole: msg.senderRole,
            senderName: msg.senderName,
            message: msg.message,
        })),
    }
}

function buildPrompt(ctx: InterviewContext): string {
    const questionsText = ctx.questions
        .map(
            (q, i) => `
Question ${i + 1}: ${q.title} (${q.difficulty})
Status: ${q.status}
Test results: ${q.passCount}/${q.totalCount} passed
Language used: ${q.language ?? "N/A"}
Final code:
${q.finalCode ?? "No code written"}
`
        )
        .join("\n---\n");

    const chatText =
        ctx.chatMessages.length > 0
            ? ctx.chatMessages.map((m) => `[${m.senderRole}] ${m.senderName ?? "Unknown"}: ${m.message}`).join("\n")
            : "No chat messages.";

    return `
You are an expert technical interviewer. Analyze the following interview session and provide structured feedback.

Candidate: ${ctx.candidateName ?? "Unknown"}

Questions attempted:
${questionsText}

Chat transcript:
${chatText}

Respond with a valid JSON object only, no extra text, no markdown. Use this exact structure:
{
  "summaryText": "2-3 sentence overall summary of the candidate performance",
  "strengths": ["strength 1", "strength 2"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "recommendation": "HIRE | NO_HIRE | STRONG_HIRE | STRONG_NO_HIRE"
}
`;
}

export async function generateAndSaveAISummary(interviewId: string) {
    const existing = await prisma.aISummary.findUnique({ where: { id: interviewId } })
    if (existing) return existing

    const ctx = await buildInterviewContext(interviewId)
    const prompt = buildPrompt(ctx)

    const completion = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1000,
    })

    const raw = completion.choices[0]?.message?.content ?? ""

    let parsed: AISummaryResult

    try {
        parsed = JSON.parse(raw)
    } catch (error) {
        throw new ApiError(500, "AI returned invalid JSON response")
    }

    const summary = await prisma.aISummary.create({
        data: {
            interviewId,
            summaryText: parsed.summaryText,
            strengths: parsed.strengths,
            weaknesses: parsed.weaknesses,
            recommendation: parsed.recommendation,
        }
    })

    return summary
}