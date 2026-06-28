import { enqueueCodeExecution } from "../src/queues/codeExecution.queue";

const submissionId = "submissionId";
await enqueueCodeExecution(submissionId);
console.log("Job enqueued");
process.exit(0);