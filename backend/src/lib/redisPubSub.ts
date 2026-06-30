import Redis from "ioredis";
import { env } from "../config/env";

export const redisPublisher = new Redis({ host: env.redisHost, port: env.redisPort});
export const redisSubscriber = new Redis({ host: env.redisHost, port: env.redisPort });

export const SUBMISSION_COMPLETED_CHANNEL = "submission:completed";

export interface SubmissionCompletedMessage {
  interviewId: string;
  submissionId: string;
}

export async function publishSubmissionCompleted(msg:SubmissionCompletedMessage) {
    await redisPublisher.publish(SUBMISSION_COMPLETED_CHANNEL, JSON.stringify(msg))
}