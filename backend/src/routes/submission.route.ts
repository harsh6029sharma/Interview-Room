import { Router } from "express";
import { submitCode, getSubmission } from "../controllers/submission.controller";
import { requireRoomAccess } from "../middlewares/auth.middleware";

const router = Router();

router.post("/interviews/:id/questions/:iqId/submit", requireRoomAccess, submitCode);
router.get("/submissions/:id", requireRoomAccess, getSubmission);

export default router;