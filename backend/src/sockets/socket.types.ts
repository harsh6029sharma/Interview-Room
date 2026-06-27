import type { RoomPayload } from "../utils/jwt.util";
import { Socket } from "socket.io";

export interface SocketData {
  room: RoomPayload;
  displayName: string | null;
  allowedQuestionIds: Set<string>;
}

export interface ClientToServerEvents {
  "code:join": (data: { interviewQuestionId: string }) => void;
  "code:change": (data: {
    interviewQuestionId: string;
    code: string;
    language: string;
  }) => void;
  "chat:message": (data: { message: string }) => void;
}

export interface ServerToClientEvents {
  "code:init": (data: { code: string; language: string; version: number }) => void;
  "code:update": (data: { code: string; language: string; version: number }) => void;
  "chat:message": (data: {
    senderRole: "INTERVIEWER" | "CANDIDATE" | "SYSTEM";
    senderName: string | null;
    message: string;
    sentAt: Date;
  }) => void;
  "error": (data: { message: string }) => void;
}

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>