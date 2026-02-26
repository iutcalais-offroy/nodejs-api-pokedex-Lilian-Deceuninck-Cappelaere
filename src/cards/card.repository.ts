import prisma from '../database'
import { Card } from '../generated/prisma/client'

export const cardRepository = {
  /**
   * Cherche les cartes et les tries dans l'ordre croissant
   * @returns {Promise<Card[]>} le tableau contenant la liste des cartes
   */
  async findCards(): Promise<Card[]> {
    return await prisma.card.findMany({
      orderBy: {
        pokedexNumber: 'asc', // Tri croissant
      },
    })
  },
}
