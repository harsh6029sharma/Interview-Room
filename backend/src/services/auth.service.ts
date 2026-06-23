import bcrypt from 'bcrypt'
import { ApiError } from '../utils/ApiError'
import { prisma } from '../lib/prisma'
import { signAuthToken } from '../utils/jwt.util'


export async function signup(email: string, password: string, name: string) {

    // check the existing user
    const existingUser = await prisma.user.findUnique({
        where: {
            email: email
        }
    })

    if (!existingUser) {
        throw new ApiError(409, "Email already registered")
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
        data: {
            email: email,
            password: hashedPassword,
            name: name
        }
    })

    const token = signAuthToken({ sub: user.id, email: user.email })
    return { token, user: { id: user.id, email: user.email, name: user.name } }

}

export async function login(email: string, password: string) {
    const user = await prisma.user.findUnique({
        where: {
            email: email
        }
    })

    if (!user) throw new ApiError(401, "Invalid credentials");

    const isValidPassword = await bcrypt.compare(password, user.password)

    if (!isValidPassword) throw new ApiError(401, "Invalid credentials");

    const token = signAuthToken({ sub: user.id, email: user.email });
    return { token, user: { id: user.id, email: user.email, name: user.name } };
}