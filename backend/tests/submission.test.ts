import { prisma } from "../src/lib/prisma";
import { signRoomToken } from "../src/utils/jwt.util";

const SERVER_URL = process.env.TEST_SERVER_URL ?? "http://localhost:3000";

function sleep(ms: number) {
    return new Promise((res) => setTimeout(res, ms));
}

async function setupTestData() {
    const interviewer = await prisma.user.create({
        data: {
            email: `submission-test-${Date.now()}@local.test`,
            password: "not-used-in-this-test",
            name: "Test Interviewer",
        },
    });

    const interview = await prisma.interview.create({
        data: {
            title: "Submission Flow Test",
            scheduledAt: new Date(),
            interviewerId: interviewer.id,
            candidateName: "Test Candidate",
            candidateEmail: "candidate@local.test",
        },
    });

    const question = await prisma.question.create({
        data: {
            title: "Reverse a string",
            description: "Write a function that reverses a string.",
            functionName: "reverse",
            starterCode: { javascript: "function reverse(s) {\n  // TODO\n}" },
            testCases: [
                { input: ["hello"], expected: "olleh" },
                { input: ["abc"], expected: "cba" },
            ],
        },
    });

    const interviewQuestion = await prisma.interviewQuestion.create({
        data: {
            interviewId: interview.id,
            questionId: question.id,
            order: 1,
        },
    });

    return { interviewer, interview, question, interviewQuestion };
}

async function cleanup(ids: {
    interviewId: string;
    questionId: string;
    interviewQuestionId: string;
    userId: string;
}) {
    await prisma.submission.deleteMany({ where: { interviewQuestionId: ids.interviewQuestionId } });
    await prisma.interviewQuestion.delete({ where: { id: ids.interviewQuestionId } });
    await prisma.question.delete({ where: { id: ids.questionId } });
    await prisma.interview.delete({ where: { id: ids.interviewId } });
    await prisma.user.delete({ where: { id: ids.userId } });
}

async function main() {
    const { interviewer, interview, question, interviewQuestion } = await setupTestData();

    const candidateToken = signRoomToken({
        interviewId: interview.id,
        role: "CANDIDATE",
        userId: null,
        candidateName: "Test Candidate",
    });

    console.log("--- Test 1: POST /submit (valid) ---");
    const submitRes = await fetch(
        `${SERVER_URL}/api/v1/interviews/${interview.id}/questions/${interviewQuestion.id}/submit`,
        {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${candidateToken}`,
            },
            body: JSON.stringify({
                code: "function reverse(s) { return s.split('').reverse().join(''); }",
                language: "javascript",
            }),
        }
    );

    const submitBody = await submitRes.json();
    console.log(`Status: ${submitRes.status}`, submitBody);

    if (submitRes.status !== 202) {
        // Submission was not accepted, stop here
        console.error("Expected 202, got", submitRes.status);
        process.exit(1);
    }

    const submissionId = submitBody.data.submissionId;

    console.log("\n--- Test 2: GET /submissions/:id (poll until processed) ---");
    let final = null;
    for (let i = 0; i < 20; i++) {
        try {
            await sleep(500);
            const pollRes = await fetch(`${SERVER_URL}/api/v1/submissions/${submissionId}`, {
                headers: { Authorization: `Bearer ${candidateToken}` },
            });
            const pollBody = await pollRes.json();
            console.log("Poll response:", JSON.stringify(pollBody));
            if (pollBody.data.totalCount > 0) {
                final = pollBody.data;
                break;
            }
        } catch (error) {
            console.error(error)
        }
    }

    if (!final) {
        // Worker did not process submission in time
        console.error("Timed out - is `npm run worker` running?");
    } else {
        console.log(`Pass: ${final.passCount}/${final.totalCount}`);
        console.log(
            final.passCount === 2 && final.totalCount === 2
                ? "Submission flow correct"
                : "Unexpected result"
        );
    }

    console.log("\n--- Test 3: wrong interview JWT (expect 401) ---");
    const otherInterview = await prisma.interview.create({
        data: {
            title: "Other interview",
            scheduledAt: new Date(),
            interviewerId: interviewer.id,
        },
    });
    const wrongToken = signRoomToken({
        interviewId: otherInterview.id,
        role: "CANDIDATE",
        userId: null,
    });

    const wrongRes = await fetch(
        `${SERVER_URL}/api/v1/interviews/${interview.id}/questions/${interviewQuestion.id}/submit`,
        {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${wrongToken}` },
            body: JSON.stringify({ code: "x", language: "javascript" }),
        }
    );
    console.log(
        `Status: ${wrongRes.status}`,
        wrongRes.status === 401 ? "correctly rejected" : "should be 401"
    );

    await prisma.interview.delete({ where: { id: otherInterview.id } });
    await cleanup({
        interviewId: interview.id,
        questionId: question.id,
        interviewQuestionId: interviewQuestion.id,
        userId: interviewer.id,
    });

    console.log("\nDone.");
    process.exit(0);
}

main().catch((err) => {
    console.error("Test failed:", err);
    process.exit(1);
});