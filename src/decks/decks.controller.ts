import { Request, Response } from 'express'
import { decksService } from './decks.service'

export const decksController = {
  async postDecks(req: Request, res: Response): Promise<Response> {
    const { name, cards } = req.body

    try {
      // Vérifier que les données sont complètes
      if (!name) {
        return res.status(400).json({ error: 'Le nom du deck est manquant' })
      }

      if (!cards || cards.length !== 10) {
        return res
          .status(400)
          .json({ error: 'Le deck doit contenir exactement 10 cartes' })
      }

      await decksService.creationDecks(name, req.user.userId, cards)

      // Code 201 en cas de succès
      return res.status(201).json('Deck créé avec succès')
    } catch (error: unknown) {
      // Code 400 en cas d'id de cartes invalides/inexistants
      if (error instanceof Error && error.message === 'CARDS_INVALIDE') {
        return res.status(400).json({
          error:
            'Un ou plusieurs numéros de cartes fournies sont invalides ou inexistant',
        })
      }

      // Code 500 en cas d'erreur serveur
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  },
}
