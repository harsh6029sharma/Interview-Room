import { runInSandbox } from "./sandbox/runner";
import type { TestCase } from "./sandbox/harness";
import { prisma } from "./lib/prisma";
import { Prisma } from "../generated/prisma/client";
import { connection,type CodeExecutionJob } from "./queues/codeExecution.queue";
import { Worker,Job } from "bullmq";
import { publishSubmissionCompleted } from "./lib/redisPubSub";

async function executeCode(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      interviewQuestion: { include: { question: true } }
    }
  })

  if (!submission) {
    throw new Error(`Submission ${submissionId} not found`);
  }

  const { question,interviewId } = submission.interviewQuestion

  const testCases = question.testCases as unknown as TestCase[]

  const result = await runInSandbox(
    submission.code,
    question.functionName,
    testCases,
    submission.language,
    submission.id
  )

  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      testResults: result.results as Prisma.InputJsonValue,
      passCount: result.passCount,
      totalCount: result.totalCount,
      executionTime: result.executionTimeMs
    }
  })

  await publishSubmissionCompleted({interviewId, submissionId})

  console.log(`[worker] Submission ${submissionId}: ${result.passCount}/${result.totalCount} passed`);
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