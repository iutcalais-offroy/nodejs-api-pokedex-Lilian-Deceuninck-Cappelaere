import { Router } from 'express'
import { cardController } from './card.controller'

export const cardRouter = Router()


// Accessible via GET /api/cards
cardRouter.get('/', cardController.getCards)