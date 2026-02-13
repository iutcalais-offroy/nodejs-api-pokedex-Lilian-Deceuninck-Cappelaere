import { Router } from 'express'
import { authController } from './auth.controller'

export const authRouter = Router()

// POST /api/auth/sign-up
// Accessible via POST /api/auth/sign-up
authRouter.post('/sign-up', authController.signUp)

// POST api/auth/sign-in
// Accessible via POST api/auth/sign-in
authRouter.post('/sign-in', authController.signIn)