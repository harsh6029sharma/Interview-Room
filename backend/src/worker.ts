import { runInSandbox } from "./sandbox/runner";
import type { TestCase } from "./sandbox/harness";
import { prisma } from "./lib/prisma";
import { Prisma } from "../generated/prisma/client";

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

  const { question } = submission.interviewQuestion

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
  console.log(`[worker] Submission ${submissionId}: ${result.passCount}/${result.totalCount} passed`);
}