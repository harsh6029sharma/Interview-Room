import type { Request,Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import * as questionService from "../services/question.service";
import asyncHandler from "../utils/asyncHandler";

export const getQuestionsHandler = asyncHandler(async (req: Request, res: Response) => {
  const questions = await questionService.getAllQuestions();
  return res.status(200).json(new ApiResponse(200, questions, "questions fetched successfully"));
});