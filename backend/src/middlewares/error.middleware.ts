import type{ Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/ApiError";
import { logger } from "../lib/logger";

export function errorMiddleware(err: Error,req: Request,res: Response,next: NextFunction) {
  logger.error({ err, path: req.path, method: req.method }, "Request error");
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}