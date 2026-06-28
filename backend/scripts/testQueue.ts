import { enqueueCodeExecution } from "../src/queues/codeExecution.queue";

async function main() {
  await enqueueCodeExecution("test123");
  console.log("Job Enqueued");
}

main();