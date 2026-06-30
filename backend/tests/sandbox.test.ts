import { prisma } from "../src/lib/prisma";
import { enqueueCodeExecution } from "../src/queues/codeExecution.queue";

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function setupTestData() {
  const interviewer = await prisma.user.create({
    data: {
      email: `sandbox-test-${Date.now()}@local.test`,
      password: "not-used-in-this-test",
      name: "Test Interviewer",
    },
  });

  const interview = await prisma.interview.create({
    data: {
      title: "Sandbox Test",
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
        { input: ["abc"], expected: "WRONG_ON_PURPOSE" }, // should fail
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

  const submission = await prisma.submission.create({
    data: {
      interviewQuestionId: interviewQuestion.id,
      language: "javascript",
      code: "function reverse(s) { return s.split('').reverse().join(''); }",
      testResults: {},
      passCount: 0,
      totalCount: 0,
    },
  });

  return { interviewer, interview, question, interviewQuestion, submission };
}

async function cleanup(ids: {
  interviewId: string;
  questionId: string;
  interviewQuestionId: string;
  submissionId: string;
  userId: string;
}) {
  await prisma.submission.delete({ where: { id: ids.submissionId } }).catch(() => {});
  await prisma.interviewQuestion.delete({ where: { id: ids.interviewQuestionId } });
  await prisma.question.delete({ where: { id: ids.questionId } });
  await prisma.interview.delete({ where: { id: ids.interviewId } });
  await prisma.user.delete({ where: { id: ids.userId } });
}

async function main() {
  const { interviewer, interview, question, interviewQuestion, submission } =
    await setupTestData();

  console.log(`Submission created: ${submission.id}`);
  console.log("Enqueuing job...");
  await enqueueCodeExecution(submission.id);

  console.log("Waiting for worker to process (make sure `npm run worker` is running)...");

  let result = null;
  for (let i = 0; i < 20; i++) {
    await sleep(500);
    const updated = await prisma.submission.findUnique({ where: { id: submission.id } });
    if (updated?.executionTime !== null) {
      result = updated;
      break;
    }
  }

  if (!result) {
    console.error("Timed out waiting for worker. Is `npm run worker` running in another terminal?");
  } else {
    console.log("\n--- Result ---");
    console.log(`Pass: ${result.passCount}/${result.totalCount}`);
    console.log(`Execution time: ${result.executionTime}ms`);
    console.log("Details:", JSON.stringify(result.testResults, null, 2));

    if (result.passCount === 2 && result.totalCount === 3) {
      console.log("\nExpected outcome (2 pass, 1 intentional fail) — sandbox working correctly.");
    } else {
      console.log("\nUnexpected pass count — check harness/runner logic.");
    }
  }

  await cleanup({
    interviewId: interview.id,
    questionId: question.id,
    interviewQuestionId: interviewQuestion.id,
    submissionId: submission.id,
    userId: interviewer.id,
  });

  console.log("\nDone. Test data cleaned up.");
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Test failed:", err);
  process.exit(1);
});