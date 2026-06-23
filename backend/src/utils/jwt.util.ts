import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AuthSessionPayload {
  sub: string;
  email: string;
  type: "auth_session";
}

export interface RoomPayload {
  interviewId: string;
  role: "INTERVIEWER" | "CANDIDATE";
  userId: string | null;
  candidateName?: string;
  type: "room";
}

export function signAuthToken(payload: Omit<AuthSessionPayload, "type">) {
  return jwt.sign(
    { ...payload, type: "auth_session" },
    env.jwtAuthSecret,
    { expiresIn: env.jwtAuthExpiry }
  );
}

export function verifyAuthToken(token: string): AuthSessionPayload {
  const decoded = jwt.verify(token, env.jwtAuthSecret) as AuthSessionPayload;
  if (decoded.type !== "auth_session") throw new Error("Invalid token type");
  return decoded;
}

export function signRoomToken(payload: Omit<RoomPayload, "type">) {
  return jwt.sign(
    { ...payload, type: "room" },
    env.jwtRoomSecret,
    { expiresIn: env.jwtRoomExpiry }
  );
}

export function verifyRoomToken(token: string): RoomPayload {
  const decoded = jwt.verify(token, env.jwtRoomSecret) as RoomPayload;
  if (decoded.type !== "room") throw new Error("Invalid token type");
  return decoded;
}