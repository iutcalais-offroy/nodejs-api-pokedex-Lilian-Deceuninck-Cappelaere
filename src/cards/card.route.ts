import { Router } from 'express'
import { cardController } from './card.controller'

export const cardRouter = Router()

/** Route GET /api/cards*/
cardRouter.get('/', cardController.getCards)
