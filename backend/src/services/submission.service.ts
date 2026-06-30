import { prisma } from "../lib/prisma";
import { enqueueCodeExecution } from "../queues/codeExecution.queue";

export async function createSubmission(interviewId: string, interviewQuestionId: string, code: string, language: string) {

    const iq = await prisma.interviewQuestion.findUnique({
        where: {
            id: interviewQuestionId
        }
    })
    if (!iq || iq.interviewId !== interviewId) {
        throw new Error("QUESTION_NOT_FOUND");
    }

    const submission = await prisma.submission.create({
        data:{
            interviewQuestionId,
            code,
            language,
            testResults:{},
            passCount:0,
            totalCount:0
        }
    })

    await enqueueCodeExecution(submission.id)

    return submission
}


export async function getSubmissionById(id: string) {
  return prisma.submission.findUnique({ where: { id } });
}