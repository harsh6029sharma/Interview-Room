import { io as ioClient, Socket } from "socket.io-client";
import { prisma } from "../src/lib/prisma";
import { signRoomToken } from "../src/utils/jwt.util";

const SERVER_URL = process.env.TEST_SERVER_URL ?? "http://localhost:3000";

function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms));
}

async function setupTestData() {
  const interviewer = await prisma.user.create({
    data: {
      email: `socket-test-${Date.now()}@local.test`,
      password: "not-used-in-this-test",
      name: "Test Interviewer",
    },
  });

  const interview = await prisma.interview.create({
    data: {
      title: "Socket Layer Test",
      scheduledAt: new Date(),
      interviewerId: interviewer.id,
      candidateName: "Test Candidate",
      candidateEmail: "candidate@local.test",
    },
  });

  const question = await prisma.question.create({
    data: {
      title: "Reverse a string",
      description: "Write a function to reverse a string.",
      starterCode: { javascript: "function reverse(s) {\n  // TODO\n}" },
      testCases: [],
    },
  });

  const interviewQuestion = await prisma.interviewQuestion.create({
    data: {
      interviewId: interview.id,
      questionId: question.id,
      order: 1,
    },
  });

  return { interviewer, interview, question, interviewQuestion };
}

async function cleanup(ids: {
  interviewId: string;
  questionId: string;
  interviewQuestionId: string;
  userId: string;
}) {
  await prisma.codeSession
    .delete({ where: { interviewQuestionId: ids.interviewQuestionId } })
    .catch(() => {});
  await prisma.chatMessage.deleteMany({ where: { interviewId: ids.interviewId } });
  await prisma.interviewQuestion.delete({ where: { id: ids.interviewQuestionId } });
  await prisma.question.delete({ where: { id: ids.questionId } });
  await prisma.interview.delete({ where: { id: ids.interviewId } });
  await prisma.user.delete({ where: { id: ids.userId } });
}

function connectSocket(token: string, label: string): Promise<Socket> {
  return new Promise((resolve, reject) => {
    const socket = ioClient(SERVER_URL, { auth: { token } });

    socket.on("connect", () => {
      console.log(`[${label}] connected: ${socket.id}`);
      resolve(socket);
    });

    socket.on("connect_error", (err) => {
      console.error(`[${label}] connect_error:`, err.message);
      reject(err);
    });

    socket.on("error", (data) => {
      console.error(`[${label}] server error event:`, data);
    });
  });
}

async function main() {
  const { interviewer, interview, question, interviewQuestion } = await setupTestData();

  const interviewerToken = signRoomToken({
    interviewId: interview.id,
    role: "INTERVIEWER",
    userId: interviewer.id,
  });

  const candidateToken = signRoomToken({
    interviewId: interview.id,
    role: "CANDIDATE",
    userId: null,
    candidateName: "Test Candidate",
  });

  const interviewerSocket = await connectSocket(interviewerToken, "INTERVIEWER");
  const candidateSocket = await connectSocket(candidateToken, "CANDIDATE");

  candidateSocket.on("code:init", (data) => console.log("[CANDIDATE] code:init", data));
  candidateSocket.on("code:update", (data) => console.log("[CANDIDATE] code:update", data));
  interviewerSocket.on("code:init", (data) => console.log("[INTERVIEWER] code:init", data));
  interviewerSocket.on("code:update", (data) => console.log("[INTERVIEWER] code:update", data));

  interviewerSocket.on("chat:message", (data) => console.log("[INTERVIEWER] chat:message", data));
  candidateSocket.on("chat:message", (data) => console.log("[CANDIDATE] chat:message", data));

  console.log("\n--- Test 1: code:join (both) ---");
  interviewerSocket.emit("code:join", { interviewQuestionId: interviewQuestion.id });
  candidateSocket.emit("code:join", { interviewQuestionId: interviewQuestion.id });
  await sleep(500);

  console.log("\n--- Test 2: code:change (interviewer types, candidate should get code:update) ---");
  interviewerSocket.emit("code:change", {
    interviewQuestionId: interviewQuestion.id,
    code: "function reverse(s) { return s.split('').reverse().join(''); }",
    language: "javascript",
  });
  await sleep(500);

  console.log("\n--- Test 3: chat:message (candidate sends, both should receive) ---");
  candidateSocket.emit("chat:message", { message: "Hi, starting now!" });
  await sleep(500);

  console.log("\n--- Test 4: unauthorized code:change (skip code:join, expect error) ---");
  const rogueToken = signRoomToken({
    interviewId: interview.id,
    role: "CANDIDATE",
    userId: null,
    candidateName: "Rogue",
  });
  const rogueSocket = await connectSocket(rogueToken, "ROGUE");
  rogueSocket.emit("code:change", {
    interviewQuestionId: interviewQuestion.id,
    code: "hacked",
    language: "javascript",
  });
  await sleep(500);

  interviewerSocket.disconnect();
  candidateSocket.disconnect();
  rogueSocket.disconnect();

  await cleanup({
    interviewId: interview.id,
    questionId: question.id,
    interviewQuestionId: interviewQuestion.id,
    userId: interviewer.id,
  });

  console.log("\nDone. Test data cleaned up.");
  process.exit(0);
}

main().catch(async (err) => {
  console.error("Test failed:", err);
  process.exit(1);
});