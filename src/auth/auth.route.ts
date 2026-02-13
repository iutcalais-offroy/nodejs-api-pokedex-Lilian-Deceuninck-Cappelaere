import { Router } from 'express'
import { authController } from './auth.controller'

export const authRouter = Router()

// POST /api/auth/sign-up
// Accessible via POST /api/auth/sign-up
authRouter.post('/', authController.signUp)

// POST api/auth/sign-in
// Accessible via POST api/auth/sign-in
authRouter.post('/', authController.signIn)