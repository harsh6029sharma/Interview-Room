import type { Request, Response } from "express";
import { createSubmission, getSubmissionById } from "../services/submission.service";
import asyncHandler from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";


export const submitCode = asyncHandler(async (req, res) => {
    const interviewId = req.params.id as string
    const iqId = req.params.iqId as string
    const { code, language } = req.body

    if (!interviewId || !iqId) {
        throw new ApiError(400, "interviewId and iqId are required")
    }

    if (!code || !language) {
        throw new ApiError(400, "code and language are required")
    }

    const submission = await createSubmission(interviewId, iqId, code, language)

    res.status(202).json(new ApiResponse(202, { submissionId: submission.id, status: "queued" }, "Submission queued"))

})

export const getSubmission = asyncHandler(async (req: Request, res: Response) => {
    const submissionId = req.params.id as string
    const submission = await getSubmissionById(submissionId);
    res.status(200).json(new ApiResponse(200, submission));
});
