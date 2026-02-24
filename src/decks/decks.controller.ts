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

  async getDecks(req: Request, res: Response): Promise<Response> {
    try {
      const decks = await decksService.getDecks(req.user.userId)
      return res.status(200).json(decks)
    } catch (error: unknown) {
      if (error instanceof Error) {
        return res.json({ error: 'Erreur' })
      }

      // Code 500 en cas d'erreur serveur
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  },

  async getDeckId(req: Request, res: Response): Promise<Response> {
    const id = parseInt(req.params.id)
    try {
      const deck = await decksService.getDeckId(id, req.user.userId)
      return res.status(200).json(deck)
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'DECK_INEXISTANT') {
        return res.status(404).json({ error: "Le deck n'existe pas" })
      }

      if (
        error instanceof Error &&
        error.message === 'DECK_AUTRE_UTILISATEUR'
      ) {
        return res
          .status(403)
          .json({ error: "Le deck n'appartient pas à l'utilisateur" })
      }

      // Code 500 en cas d'erreur serveur
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  },

  async patchDeck(req: Request, res: Response): Promise<Response> {
    const id = parseInt(req.params.id)
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

      await decksService.patchDeck(id, name, req.user.userId, cards)

      // Code 200 en cas de succès
      return res.status(200).json('Deck modifié avec succès')
    } catch (error: unknown) {
      // Code 400 en cas d'id de cartes invalides/inexistants
      if (error instanceof Error && error.message === 'CARDS_INVALIDE') {
        return res.status(400).json({
          error:
            'Un ou plusieurs numéros de cartes fournies sont invalides ou inexistant',
        })
      }
      if (error instanceof Error && error.message === 'DECK_INEXISTANT') {
        return res.status(404).json({ error: "Le deck n'existe pas" })
      }

      if (
        error instanceof Error &&
        error.message === 'DECK_AUTRE_UTILISATEUR'
      ) {
        return res
          .status(403)
          .json({ error: "Le deck n'appartient pas à l'utilisateur" })
      }

      // Code 500 en cas d'erreur serveur
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  },

  async deleteDeck(req: Request, res: Response): Promise<Response> {
    const id = parseInt(req.params.id)
    try {
      await decksService.getDeckId(id, req.user.userId)
      await decksService.deleteDeck(id, req.user.userId)
      return res.status(200).json('Deck supprimé avec succès')
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'DECK_INEXISTANT') {
        return res.status(404).json({ error: "Le deck n'existe pas" })
      }

      if (
        error instanceof Error &&
        error.message === 'DECK_AUTRE_UTILISATEUR'
      ) {
        return res
          .status(403)
          .json({ error: "Le deck n'appartient pas à l'utilisateur" })
      }

      // Code 500 en cas d'erreur serveur
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  },
}
