import { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import { verifyRoomToken } from "../utils/jwt.util";
import type { ClientToServerEvents, ServerToClientEvents, SocketData } from "./socket.types";
import { prisma } from "../lib/prisma";

export function initSocket(httpServer: HttpServer) {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    Record<string, never>,
    SocketData
  >
    (httpServer, {
      cors: {
        origin: "*"
      }
    })

  // auth middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error("Missing room token"))

      const payload = verifyRoomToken(token)

      socket.data.room = payload
      socket.data.allowedQuestionIds = new Set()
      socket.data.displayName = payload.candidateName ?? null

      next()
    } catch (error) {
      next(new Error("Invalid or expired  room token"))
    }
  })

  io.on("connection", async (socket) => {
    const { interviewId, role, userId } = socket.data.room
    socket.join(interviewId)

    if (role === "INTERVIEWER" && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true }
      })
      socket.data.displayName = user?.name ?? null

    }

    // code:join
    socket.on("code:join", async ({ interviewQuestionId }) => {
      try {
        const iq = await prisma.interviewQuestion.findUnique({
          where: {
            id: interviewQuestionId
          },
          include: { question: true }
        })

        if (!iq || iq.interviewId !== interviewId) {
          socket.emit("error", { message: "Question not found in this interview" })
          return
        }

        socket.data.allowedQuestionIds.add(interviewQuestionId)

        const session = await prisma.codeSession.findUnique({
          where: { interviewQuestionId }
        })

        if (session) {
          socket.emit("code:init", {
            code: session.currentCode,
            language: session.language,
            version: session.version
          })

          return
        }

        // if no session yet then fallback to starter code
        const starterCode = iq.question.starterCode as Record<string, string>
        const defaultLanguage = Object.keys(starterCode)[0] ?? "javascript"

        socket.emit("code:init", {
          code: starterCode[defaultLanguage] ?? "",
          language: defaultLanguage,
          version: 0
        })
      } catch (err) {

        socket.emit("error", { message: "Not authorized for this question" })
        return

      }
    })

    // code : change
    socket.on("code:change", async ({ interviewQuestionId, code, language }) => {
      if (!socket.data.allowedQuestionIds.has(interviewQuestionId)) {
        socket.emit("error", { message: "Not authorized for this question" })
        return
      }

      try {
        const session = await prisma.codeSession.upsert({
          where: { interviewQuestionId },
          create: { interviewQuestionId, currentCode: code, language, version: 0 },
          update: { currentCode: code, language, version: { increment: 1 } },
        })

        socket.to(interviewId).emit("code:update", {
          code: session.currentCode,
          language: session.language,
          version: session.version
        })
      } catch (err) {
        socket.emit("error", { message: "Failed to sync code" })
      }
    })


    // chat:message
    socket.on("chat:message", async ({ message }) => {
      try {
        const chatMessage = await prisma.chatMessage.create({
          data: {
            interviewId,
            senderRole: role,
            senderName: socket.data.displayName,
            message
          }
        })

        io.to(interviewId).emit("chat:message", {
          senderRole: chatMessage.senderRole,
          senderName: chatMessage.senderName,
          message: chatMessage.message,
          sentAt: chatMessage.sentAt
        })
      } catch (error) {
        socket.emit("error", { message: "Failed to send message" });
      }
    })

    socket.on("disconnect", ()=>{
      console.log(`Socket disconnected: ${socket.id}, interview: ${interviewId}`);
    })
  })

  return io
}