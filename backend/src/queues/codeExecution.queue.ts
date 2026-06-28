import 'dotenv/config'
import { Queue } from 'bullmq'

// redis connection creation
export const connection = {
    host: process.env.REDIS_HOST ?? "localhost",
    port: parseInt(process.env.REDIS_PORT ?? "6379", 10)
}

// type of data inside each jobs
export interface CodeExecutionJob {
    submissionId:string
}

// main function to create the queue
// code-execution: is the name of queue
export const codeExecutionQueue = new Queue("code-execution", {
    connection,
    defaultJobOptions:{
        attempts:2,
        backoff: { type: "fixed", delay: 2000 },
        removeOnComplete: { count: 100 },
    }
})


export async function enqueueCodeExecution(submissionId: string) {
  return codeExecutionQueue.add("execute", { submissionId });
}