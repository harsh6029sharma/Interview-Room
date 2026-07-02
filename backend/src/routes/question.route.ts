import { Router } from "express";
import { requireAuthSession } from "../middlewares/auth.middleware";
import { getQuestionsHandler } from "../controllers/question.controller";

const router = Router();

router.get("/", requireAuthSession, getQuestionsHandler);

export default router;