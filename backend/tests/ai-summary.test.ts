import { prisma } from "../src/lib/prisma";
import { signAuthToken } from "../src/utils/jwt.util";

const SERVER_URL = process.env.TEST_SERVER_URL ?? "http://localhost:3000";

async function setupTestData() {
  const interviewer = await prisma.user.create({
    data: {
      email: `ai-test-${Date.now()}@local.test`,
      password: "not-used-in-this-test",
      name: "Test Interviewer",
    },
  });

  const interview = await prisma.interview.create({
    data: {
      title: "AI Summary Test Interview",
      scheduledAt: new Date(),
      status: "IN_PROGRESS",
      startedAt: new Date(),
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
      status: "SOLVED",
    },
  });

  // Simulate candidate wrote code
  await prisma.codeSession.create({
    data: {
      interviewQuestionId: interviewQuestion.id,
      language: "javascript",
      currentCode: "function reverse(s) { return s.split('').reverse().join(''); }",
      version: 3,
    },
  });

  // Simulate a submission result
  await prisma.submission.create({
    data: {
      interviewQuestionId: interviewQuestion.id,
      language: "javascript",
      code: "function reverse(s) { return s.split('').reverse().join(''); }",
      testResults: [
        { pass: true, input: ["hello"], actual: "olleh", expected: "olleh" },
        { pass: true, input: ["abc"], actual: "cba", expected: "cba" },
      ],
      passCount: 2,
      totalCount: 2,
      executionTime: 620,
    },
  });

  // Simulate some chat messages
  await prisma.chatMessage.createMany({
    data: [
      {
        interviewId: interview.id,
        senderRole: "INTERVIEWER",
        senderName: "Test Interviewer",
        message: "Can you walk me through your approach?",
      },
      {
        interviewId: interview.id,
        senderRole: "CANDIDATE",
        senderName: "Test Candidate",
        message: "Sure, I am splitting the string into an array, reversing it, then joining back.",
      },
    ],
  });

  return { interviewer, interview, question, interviewQuestion };
}

async function cleanup(ids: {
  interviewId: string;
  questionId: string;
  interviewQuestionId: string;
  userId: string;
}) {
  await prisma.aISummary.deleteMany({ where: { interviewId: ids.interviewId } });
  await prisma.chatMessage.deleteMany({ where: { interviewId: ids.interviewId } });
  await prisma.submission.deleteMany({ where: { interviewQuestionId: ids.interviewQuestionId } });
  await prisma.codeSession.deleteMany({ where: { interviewQuestionId: ids.interviewQuestionId } });
  await prisma.interviewQuestion.delete({ where: { id: ids.interviewQuestionId } });
  await prisma.question.delete({ where: { id: ids.questionId } });
  await prisma.interview.delete({ where: { id: ids.interviewId } });
  await prisma.user.delete({ where: { id: ids.userId } });
}

async function main() {
  const { interviewer, interview, question, interviewQuestion } = await setupTestData();

  const authToken = signAuthToken({
    sub: interviewer.id,
    email: interviewer.email,
  });

  console.log("--- Test 1: POST /interviews/:id/complete (valid interviewer) ---");
  const completeRes = await fetch(`${SERVER_URL}/api/v1/interviews/${interview.id}/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authToken}`,
    },
  });

  const completeBody = await completeRes.json();
  console.log(`Status: ${completeRes.status}`);

  if (completeRes.status !== 200) {
    console.error("Expected 200, got", completeRes.status, completeBody);
    await cleanup({
      interviewId: interview.id,
      questionId: question.id,
      interviewQuestionId: interviewQuestion.id,
      userId: interviewer.id,
    });
    process.exit(1);
  }

  const summary = completeBody.data;
  console.log("\nSummary text:", summary.summaryText);
  console.log("Strengths:", summary.strengths);
  console.log("Weaknesses:", summary.weaknesses);
  console.log("Recommendation:", summary.recommendation);

  const allFieldsPresent =
    summary.summaryText &&
    Array.isArray(summary.strengths) &&
    Array.isArray(summary.weaknesses) &&
    summary.recommendation;

  console.log(allFieldsPresent ? "\nAI summary generated correctly" : "\nMissing fields in summary");

  console.log("\n--- Test 2: POST /complete again (should return 400 already completed) ---");
  const dupeRes = await fetch(`${SERVER_URL}/api/v1/interviews/${interview.id}/complete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${authToken}` },
  });
  console.log(`Status: ${dupeRes.status}`, dupeRes.status === 400 ? "correctly rejected" : "should be 400");

  console.log("\n--- Test 3: wrong user tries to complete (expect 403) ---");
  const otherUser = await prisma.user.create({
    data: {
      email: `other-${Date.now()}@local.test`,
      password: "not-used",
      name: "Other User",
    },
  });
  const otherToken = signAuthToken({ sub: otherUser.id, email: otherUser.email });
  const otherInterview = await prisma.interview.create({
    data: {
      title: "Other Interview",
      scheduledAt: new Date(),
      interviewerId: interviewer.id,
    },
  });

  const wrongUserRes = await fetch(`${SERVER_URL}/api/v1/interviews/${otherInterview.id}/complete`, {
    method: "POST",
    headers: { Authorization: `Bearer ${otherToken}` },
  });
  console.log(`Status: ${wrongUserRes.status}`, wrongUserRes.status === 403 ? "correctly rejected" : "should be 403");

  await prisma.interview.delete({ where: { id: otherInterview.id } });
  await prisma.user.delete({ where: { id: otherUser.id } });

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