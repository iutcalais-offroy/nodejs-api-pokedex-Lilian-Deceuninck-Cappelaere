import { Request, Response } from 'express'
import { cardsService } from './card.service'

export const cardController = {
  async getCards(_req: Request, res: Response): Promise<Response> {
    try {
      const cards = await cardsService.getCards()

      // Code 200 en cas de succès
      return res.status(200).json(cards)
    } catch {
      // Code 500 en cas d'erreur serveur
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  },
}
