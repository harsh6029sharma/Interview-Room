import { prisma } from "../lib/prisma"
import { ApiError } from "../utils/ApiError"
import { signRoomToken } from "../utils/jwt.util"

export interface CreateInterviewInput {
    interviewerId:string
    title:string
    scheduledAt:Date
}

export interface JoinCandidateInput{
    interviewId:string
    candidateName: string
    candidateEmail:string
}

export async function createInterview(input:CreateInterviewInput){
    return prisma.interview.create({
        data:{
            interviewerId:input.interviewerId,
            title:input.title,
            scheduledAt:input.scheduledAt
        }
    })
}


export async function joinAsInterviewer(interviewId:string,userId:string){
    const interview = await prisma.interview.findUnique({
        where:{
            id:interviewId
        }
    })

    if (!interview) throw new ApiError(404, "Interview not found")

    if(interview.interviewerId !== userId){
        throw new ApiError(403, "you are not the interviewer for this interview")
    }

    const token = signRoomToken({interviewId, role:"INTERVIEWER", userId})
    return token
}

export async function joinAsCandidate(input: JoinCandidateInput) {
  const interview = await prisma.interview.findUnique({ where: { id: input.interviewId } })
  if (!interview) throw new ApiError(404, "Interview not found")
  if (interview.status === "COMPLETED" || interview.status === "CANCELLED") {
    throw new ApiError(400, `Interview is ${interview.status.toLowerCase()}`)
  }

  await prisma.interview.update({
    where: { id: input.interviewId },
    data: {
      candidateName: input.candidateName,
      candidateEmail: input.candidateEmail,
    },
  })

  const token = signRoomToken({
    interviewId: input.interviewId,
    role: "CANDIDATE",
    userId: null,
    candidateName: input.candidateName,
  })
  return { token }
}

export async function getInterviewById(interviewId: string) {
  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { interviewQuestions: { include: { question: true } } },
  });
  if (!interview) throw new ApiError(404, "Interview not found");
  return interview;
}
