import type { Request, Response } from "express";
import { ApiError } from "../utils/ApiError";
import { ApiResponse } from "../utils/ApiResponse";
import asyncHandler from "../utils/asyncHandler";
import * as authService from '../services/auth.service'

interface SignupBody {
    email: string;
    password: string;
    name: string;
}

interface LoginBody {
    email: string;
    password: string
}

export const signupHandler = asyncHandler(async (req: Request, res: Response) => {
    const { email, password, name } = req.body as SignupBody

    if (!email || !password || !name) {
        throw new ApiError(400, "email,password and name are requied")
    }

    const result = await authService.signup(email, password, name)

    if(!result){}
    return res.status(200).json(
        new ApiResponse(200, result, "user signup successfully")
    )
})

export const loginHandler = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginBody

    if (!email || !password) {
        throw new ApiError(400, "email and password are required");
    }

    const user = await authService.login(email, password)

    return res.status(200).json(
        new ApiResponse(200, user, "user login successfully")
    )

})