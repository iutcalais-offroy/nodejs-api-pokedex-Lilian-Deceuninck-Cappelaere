import { Router } from 'express'
import { decksController } from './decks.controller'
import { authenticateToken } from '../auth/auth.middleware'

export const decksRouter = Router()

/** Route POST /api/decks*/
decksRouter.post('/', authenticateToken, decksController.postDecks)

/** Route GET /api/decks/mine*/
decksRouter.get('/mine', authenticateToken, decksController.getDecks)

/** Route GET /api/decks/:id*/
decksRouter.get('/:id', authenticateToken, decksController.getDeckId)

/** Route PATCH /api/decks/:id*/
decksRouter.patch('/:id', authenticateToken, decksController.patchDeck)

/** Route DELETE /api/decks/:id*/
decksRouter.delete('/:id', authenticateToken, decksController.deleteDeck)
