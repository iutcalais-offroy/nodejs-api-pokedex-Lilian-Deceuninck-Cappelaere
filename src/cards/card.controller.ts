import { Request, Response } from 'express'
import { cardsService } from './card.service'

export const cardController = {
  /**
   * Récupère les cartes
   * @param {Request} _req - importer de express permet de récupérer les données venant de l'utilisateur (inutilisé)
   * @param {Response} res - importer de express permet de récupérer les données venant du serveur
   * @returns {Promise<Response>} 200 si réussi et 500 en cas d'erreur serveur
   */
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
