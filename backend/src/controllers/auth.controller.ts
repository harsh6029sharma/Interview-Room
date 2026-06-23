import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import * as authService from '../services/auth.service'
import { signupSchema, loginSchema } from '../validators/auth.validator'

export const signupHandler = asyncHandler(async (req: Request, res: Response) => {

    const result = signupSchema.safeParse(req.body);

    if (!result.success) {
        throw new ApiError(400, result.error.issues[0]?.message ?? "Validation failed");
    }

    const data = result.data;

    const user = await authService.signup(data.email, data.password,data.name)

    return res.status(200).json(
        new ApiResponse(200, user, "user signup successfully")
    )
})

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
    
    const result = loginSchema.safeParse(req.body)

    if (!result.success) {
        throw new ApiError(400, result.error.issues[0]?.message ?? "Validation failed");
    }

    const data = result.data

    const user = await authService.login(data.email, data.password)

    return res.status(200).json(
        new ApiResponse(200, user, "user login successfully")
    )
})