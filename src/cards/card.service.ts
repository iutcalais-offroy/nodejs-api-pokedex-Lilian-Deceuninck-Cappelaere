import { cardRepository } from './card.repository'
import { Card } from '../generated/prisma/client'

export const cardsService = {
  /**
   * Fait appel à cardRepository pour récupérer la liste des cartes
   * @returns {Promise<Card[]>} la liste des cartes
   */
  async getCards(): Promise<Card[]> {
    return await cardRepository.findCards()
  },
}
