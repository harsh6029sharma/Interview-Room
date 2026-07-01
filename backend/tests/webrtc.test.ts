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
      email: `webrtc-test-${Date.now()}@local.test`,
      password: "not-used",
      name: "Test Interviewer",
    },
  });

  const interview = await prisma.interview.create({
    data: {
      title: "WebRTC Signaling Test",
      scheduledAt: new Date(),
      interviewerId: interviewer.id,
      candidateName: "Test Candidate",
    },
  });

  return { interviewer, interview };
}

async function cleanup(ids: { interviewId: string; userId: string }) {
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
    socket.on("connect_error", reject);
    socket.on("error", (data) => console.error(`[${label}] server error:`, data));
  });
}

async function main() {
  const { interviewer, interview } = await setupTestData();

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

  const fakeSdpOffer = { type: "offer", sdp: "fake-sdp-offer-string" } as RTCSessionDescriptionInit;
  const fakeSdpAnswer = { type: "answer", sdp: "fake-sdp-answer-string" } as RTCSessionDescriptionInit;
  const fakeIceCandidate = { candidate: "candidate:fake", sdpMid: "0", sdpMLineIndex: 0 } as RTCIceCandidateInit;

  console.log("\n--- Test 1: offer (interviewer -> candidate) ---");
  let offerReceived = false;
  candidateSocket.on("webrtc:offer", (data) => {
    offerReceived = true;
    console.log("[CANDIDATE] received webrtc:offer, sdp type:", data.sdp.type);
  });
  interviewerSocket.emit("webrtc:offer", { sdp: fakeSdpOffer });
  await sleep(300);
  console.log(offerReceived ? "offer relay correct" : "offer NOT received - relay broken");

  console.log("\n--- Test 2: answer (candidate -> interviewer) ---");
  let answerReceived = false;
  interviewerSocket.on("webrtc:answer", (data) => {
    answerReceived = true;
    console.log("[INTERVIEWER] received webrtc:answer, sdp type:", data.sdp.type);
  });
  candidateSocket.emit("webrtc:answer", { sdp: fakeSdpAnswer });
  await sleep(300);
  console.log(answerReceived ? "answer relay correct" : "answer NOT received - relay broken");

  console.log("\n--- Test 3: ICE candidate (both directions) ---");
  let iceFromInterviewer = false;
  let iceFromCandidate = false;

  candidateSocket.on("webrtc:ice-candidate", () => { iceFromInterviewer = true; });
  interviewerSocket.on("webrtc:ice-candidate", () => { iceFromCandidate = true; });

  interviewerSocket.emit("webrtc:ice-candidate", { candidate: fakeIceCandidate });
  candidateSocket.emit("webrtc:ice-candidate", { candidate: fakeIceCandidate });
  await sleep(300);

  console.log(iceFromInterviewer ? "ICE interviewer->candidate correct" : "ICE interviewer->candidate broken");
  console.log(iceFromCandidate ? "ICE candidate->interviewer correct" : "ICE candidate->interviewer broken");

  console.log("\n--- Test 4: sender should NOT receive own signal ---");
  let selfReceived = false;
  interviewerSocket.on("webrtc:offer", () => { selfReceived = true; });
  interviewerSocket.emit("webrtc:offer", { sdp: fakeSdpOffer });
  await sleep(300);
  console.log(!selfReceived ? "self-echo correctly blocked" : "self-echo BUG - interviewer received own offer");

  interviewerSocket.disconnect();
  candidateSocket.disconnect();

  await cleanup({ interviewId: interview.id, userId: interviewer.id });

  console.log("\nDone.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});