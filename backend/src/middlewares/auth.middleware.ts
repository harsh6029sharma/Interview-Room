import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { verifyAuthToken, verifyRoomToken } from "../utils/jwt.util";


export function extractToken(req: Request): string {
    const header = req.headers.authorization

    if (!header?.startsWith("Bearer ")) {
        throw new ApiError(401, "Missing or malformed token")
    }

    const token = header?.split(" ")[1]

    if (!token) {
        throw new ApiError(401, "Missing token")
    }
    return token
}

export function requireAuthSession(req: Request, res: Response, next: NextFunction) {
    try {
        const token = extractToken(req)
        const decodedAuthToken = verifyAuthToken(token)

        req.user = decodedAuthToken

        next()

    } catch (error) {
        next(new ApiError(401, "Invalid or expired session"));
    }
}

export function requireRoomSession(req: Request, res: Response, next: NextFunction) {
    try {
        const token = extractToken(req)
        const room = verifyRoomToken(token)

        req.room = room

        const routeInterviewId = req.params.id;
        if (room.interviewId !== routeInterviewId) {
            throw new Error("Token does not match this interview");
        }

        req.room = room

        next()
    } catch (error) {
        next(new ApiError(401, "Invalid or expired room access"));
    }
}