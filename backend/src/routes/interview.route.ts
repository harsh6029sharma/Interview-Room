import { Router } from "express";
import { requireAuthSession, requireRoomAccess } from "../middlewares/auth.middleware";
import {
  createInterviewHandler,
  joinAsInterviewerHandler,
  joinAsCandidateHandler,
  getInterviewHandler,
} from "../controllers/interview.controller";

const router = Router()

router.post("/", requireAuthSession, createInterviewHandler);
router.post("/:id/join/interviewer", requireAuthSession, joinAsInterviewerHandler);
router.post("/:id/join/candidate", joinAsCandidateHandler);
router.get("/:id", requireRoomAccess, getInterviewHandler);

export default router;