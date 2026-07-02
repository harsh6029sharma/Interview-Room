export interface ClientToServerEvents {
    "code:join": (data: { interviewQuestionId: string }) => void;
    "code:change": (data: {
        interviewQuestionId: string;
        code: string;
        language: string;
    }) => void;
    "chat:message": (data: { message: string }) => void;
    "webrtc:offer": (data: { sdp: RTCSessionDescriptionInit }) => void;
    "webrtc:answer": (data: { sdp: RTCSessionDescriptionInit }) => void;
    "webrtc:ice-candidate": (data: { candidate: RTCIceCandidateInit }) => void;
}
export interface ServerToClientEvents {
  "code:init": (data: { code: string; language: string; version: number }) => void;
  "code:update": (data: { code: string; language: string; version: number }) => void;
  "chat:message": (data: {
    senderRole: "INTERVIEWER" | "CANDIDATE" | "SYSTEM";
    senderName: string | null;
    message: string;
    sentAt: string;
  }) => void;
  "submission:result": (data: {
    submissionId: string;
    passCount: number;
    totalCount: number;
    testResults: unknown;
    executionTime: number | null;
  }) => void;
  "room:init": (data: {
    interviewId: string;
    title: string;
    status: string;
    interviewQuestions: { id: string; questionTitle: string }[];
  }) => void;
  "webrtc:offer": (data: { sdp: RTCSessionDescriptionInit }) => void;
  "webrtc:answer": (data: { sdp: RTCSessionDescriptionInit }) => void;
  "webrtc:ice-candidate": (data: { candidate: RTCIceCandidateInit }) => void;
  "error": (data: { message: string }) => void;
}