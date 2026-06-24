import bcrypt from 'bcrypt'
import { ApiError } from '../utils/ApiError'
import { prisma } from '../lib/prisma'
import { signAuthToken } from '../utils/jwt.util'
import 'dotenv/config'
import { sanitizeUser } from '../utils/sanitizerUser'
import { logger } from '../lib/logger'

export async function signup(email: string, password: string, name: string) {

    const saltRounds = Number(process.env.SALT_ROUNDS);

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    try {
        logger.info({ email }, "Signup attempt");
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name
            }
        });

        const token = signAuthToken({
            sub: user.id,
            email: user.email
        });

       logger.info({ userId: user.id }, "Signup successful"); 

        return {
            token,
            user: sanitizeUser(user)
        };

        
    }catch (error: any) {
    if (error.code === "P2002") {
        logger.warn({ email }, "Signup blocked - email exists");
        throw new ApiError(409, "Email already registered");
    }

    logger.error({ email, err: error }, "Signup failed - unexpected error");
    throw error;
}
}

export async function login(email: string, password: string) {
     logger.info({ email }, "Login attempt");
    const user = await prisma.user.findUnique({
        where: {
            email
        },
        select: {
            id: true,
            email: true,
            name: true,
            password: true
        }
    })

    if (!user) throw new ApiError(401, "Invalid credentials");

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) throw new ApiError(401, "Invalid credentials");

    const token = signAuthToken({ sub: user.id, email: user.email });
    logger.info({ userId: user.id }, "Login successful");
    return {
        token,
        user: sanitizeUser(user)
    }
}