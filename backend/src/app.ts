import express from 'express'
import 'dotenv/config'
import cookieParser from 'cookie-parser'
import authRoutes from './routes/auth.route'
import interviewRoutes from './routes/interview.route'
import { errorMiddleware } from './middlewares/error.middleware';

const app = express()

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cookieParser())

app.use("/api/v1/auth",authRoutes)
app.use("/api/v1/interviews",interviewRoutes)

app.use(errorMiddleware)

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
})

export default app