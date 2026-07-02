import { logger } from "../lib/logger"
import { prisma } from "../lib/prisma"
import { ApiError } from "../utils/ApiError"
import { signRoomToken } from "../utils/jwt.util"
import { generateAndSaveAISummary } from "./ai.service"

export interface CreateInterviewInput {
  interviewerId: string
  title: string
  scheduledAt: Date
}

export interface JoinCandidateInput {
  interviewId: string
  candidateName: string
  candidateEmail: string
}

export async function createInterview(input: CreateInterviewInput) {

  logger.info({ input }, "createInterview called");
  const interview = await prisma.interview.create({
    data: {
      interviewerId: input.interviewerId,
      title: input.title,
      scheduledAt: input.scheduledAt
    }
  })

  logger.info(
    { interviewId: interview.id },
    "Interview created successfully"
  );

  return interview
}


export async function joinAsInterviewer(interviewId: string, userId: string) {

  logger.info(
    { interviewId, userId },
    "joinAsInterviewer called"
  );
  const interview = await prisma.interview.findUnique({
    where: {
      id: interviewId
    }
  })

  if (!interview) {
    logger.warn(
      { interviewId },
      "Interview not found"
    );
    throw new ApiError(404, "Interview not found")

  }

  if (interview.interviewerId !== userId) {
    logger.warn(
      { interviewId, userId },
      "Unauthorized interviewer access"
    );
    throw new ApiError(403, "you are not the interviewer for this interview")
  }

  const token = signRoomToken({ interviewId, role: "INTERVIEWER", userId })

  logger.info(
    { interviewId, userId },
    "Interviewer joined successfully"
  );

  return { roomToken: token }
}

export async function joinAsCandidate(input: JoinCandidateInput) {

  logger.info(
    { interviewId: input.interviewId },
    "joinAsCandidate called"
  );

  const interview = await prisma.interview.findUnique({ where: { id: input.interviewId } })
  if (!interview) {
    logger.warn(
      { interviewId: input.interviewId },
      "Interview not found"
    );
    throw new ApiError(404, "Interview not found")

  }
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

  logger.info(
    {
      interviewId: input.interviewId,
      candidateEmail: input.candidateEmail
    },
    "Candidate details saved"
  );

  const token = signRoomToken({
    interviewId: input.interviewId,
    role: "CANDIDATE",
    userId: null,
    candidateName: input.candidateName,
  })
  return { roomToken:token }
}

export async function getInterviewById(interviewId: string) {
  logger.debug(
    { interviewId },
    "Fetching interview"
  );

  const interview = await prisma.interview.findUnique({
    where: { id: interviewId },
    include: { interviewQuestions: { include: { question: true } } },
  });
  if (!interview) {
    logger.warn(
      { interviewId },
      "Interview not found"
    );
    throw new ApiError(404, "Interview not found");

  }

  return interview;
}

export async function completeInterview(interviewId:string, requesterId:string){
  const interview = await prisma.interview.findUnique({where:{id:interviewId}})

  if (!interview) throw new ApiError(404, "Interview not found");
  if (interview.interviewerId !== requesterId) throw new ApiError(403, "Only the interviewer can complete this interview");
  if (interview.status === "COMPLETED") throw new ApiError(400, "Interview already completed");

  await prisma.interview.update({
    where:{id:interviewId},
    data:{
      status:"COMPLETED",
      endedAt:new Date()
    }
  })

  const summary = await generateAndSaveAISummary(interviewId)
  return summary
}

export async function getInterviewsByInterviewer(interviewerId: string) {
  logger.debug(
    { interviewerId },
    "Fetching interviews for interviewer"
  );

  const interviews = await prisma.interview.findMany({
    where: { interviewerId },
    orderBy: { scheduledAt: "desc" },
  });

  return interviews;
}