import Router from 'express'
import { signupHandler } from '../controllers/auth.controller'

const router = Router()

router.post("/signup", signupHandler)
router.post("/login", )

export default router