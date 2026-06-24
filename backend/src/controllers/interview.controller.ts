import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler";
import { createInterviewSchema, joinCandidateSchema } from "../validators/interview.validator";
import * as interviewService from '../services/interview.service'
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";


export const createInterviewHandler = asyncHandler(async (req: Request, res: Response) => {
    
    const result = createInterviewSchema.safeParse(req.body)

    if (!result.success) {
        throw new ApiError(400, result.error.issues[0]?.message ?? "Validation failed");
    }

    const data = result.data

    const interview = await interviewService.createInterview({
        interviewerId: req.user!.sub,
        title: data.title,
        scheduledAt: data.scheduledAt
    })
    return res.status(201).json(
        new ApiResponse(201, interview, "interview created successfully")
    );
})

export const joinAsInterviewerHandler = asyncHandler(async (req: Request, res: Response) => {
    const interviewId = req.params.id

    if (!interviewId || Array.isArray(interviewId)) {
        throw new ApiError(400, "Invalid interview id");
    }

    const result = await interviewService.joinAsInterviewer(interviewId, req.user!.sub)
    return res.status(200).json(new ApiResponse(200, result, "joined as interviewer successfully"));
})



export const joinAsCandidateHandler = asyncHandler(async (req: Request, res: Response) => {
    const result = joinCandidateSchema.safeParse(req.body);
    if (!result.success) {
        throw new ApiError(400, result.error.issues[0]?.message ?? "Validation failed");
    }
    const data = result.data;

    if (data.candidateEmail === undefined) {
        throw new ApiError(400, "Candidate email is required");
    }

    const interviewId = req.params.id;

    if (!interviewId || Array.isArray(interviewId)) {
        throw new ApiError(400, "Interview id is required");
    }

    const joinResult = await interviewService.joinAsCandidate({
        interviewId: interviewId,
        candidateName: data.candidateName,
        candidateEmail: data.candidateEmail,
    });

    return res.status(200).json(
        new ApiResponse(200, joinResult, "joined as candidate")
    );
});

export const getInterviewHandler = asyncHandler(async (req: Request, res: Response) => {
    const interviewId = req.params.id;

    if (!interviewId || Array.isArray(interviewId)) {
        throw new ApiError(400, "Interview id is required");
    }

    const interview = await interviewService.getInterviewById(interviewId);
    return res.status(200).json(
        new ApiResponse(200, interview, "interview fetched successfully")
    );
});