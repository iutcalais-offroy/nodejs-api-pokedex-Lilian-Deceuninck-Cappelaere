import { Router } from 'express'
import { decksController } from './decks.controller'
import { authenticateToken } from '../auth/auth.middleware'

export const decksRouter = Router()

// Accessible via POST /api/decks
decksRouter.post('/', authenticateToken, decksController.postDecks)
