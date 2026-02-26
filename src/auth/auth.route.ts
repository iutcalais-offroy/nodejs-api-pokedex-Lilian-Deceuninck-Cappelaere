import { Router } from 'express'
import { authController } from './auth.controller'

export const authRouter = Router()

/** Route POST /api/auth/sign-up*/
authRouter.post('/sign-up', authController.signUp)

/** Route POST api/auth/sign-in*/
authRouter.post('/sign-in', authController.signIn)
