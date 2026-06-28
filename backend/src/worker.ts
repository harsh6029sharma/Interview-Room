import { Worker, Job } from "bullmq";
import { connection, type CodeExecutionJob } from "./queues/codeExecution.queue";
import { prisma } from "./lib/prisma";

async function executeCode(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      interviewQuestion: {
        include: { question: true },
      },
    },
  });

  if (!submission) {
    throw new Error(`Submission ${submissionId} not found`);
  }

  console.log(`[worker] Executing submission ${submissionId}`);
  console.log(`  language: ${submission.language}`);
  console.log(`  testCases:`, submission.interviewQuestion.question.testCases);

  // PLACEHOLDER result — it will be updated with the real sandbox data results
  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      testResults: { status: "placeholder", message: "Sandbox not implemented yet" },
      passCount: 0,
      totalCount: 0,
    },
  });
}

const worker = new Worker<CodeExecutionJob>(
  "code-execution",
  async (job: Job<CodeExecutionJob>) => {
    await executeCode(job.data.submissionId);
  },

  { connection, concurrency: 2 }
 
);

worker.on("completed", (job) => {
  console.log(`[worker] Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err.message);
});

console.log("Worker started, listening for code-execution jobs...");