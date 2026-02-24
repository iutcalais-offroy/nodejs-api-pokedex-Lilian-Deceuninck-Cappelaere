import { Router } from 'express'
import { decksController } from './decks.controller'
import { authenticateToken } from '../auth/auth.middleware'

export const decksRouter = Router()

// POST /api/decks
decksRouter.post('/', authenticateToken, decksController.postDecks)

// GET /api/decks/mine
decksRouter.get('/mine', authenticateToken, decksController.getDecks)

// GET /api/decks/:id
decksRouter.get('/:id', authenticateToken, decksController.getDeckId)

// PATCH /api/decks/:id
decksRouter.patch('/:id', authenticateToken, decksController.patchDeck)
