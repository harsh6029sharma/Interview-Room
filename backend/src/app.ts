import express from 'express'
import 'dotenv/config'
import pinoHttp from "pino-http";
import { logger } from "./lib/logger";
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.route'
import interviewRoutes from './routes/interview.route'
import { errorMiddleware } from './middlewares/error.middleware';
import submissionRoutes from './routes/submission.route'
import cors from 'cors'

const app = express()

app.use(
    cors({
        origin: process.env.FRONTEND_URL || "http://localhost:3001",
        credentials: true,
    })
);

app.use(pinoHttp({ logger }))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use("/api/v1/auth", authRoutes)
app.use("/api/v1/interviews", interviewRoutes)
app.use("/api/v1", submissionRoutes)

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})

app.use(errorMiddleware)

export default app