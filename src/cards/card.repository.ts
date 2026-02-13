import prisma from '../database'
import { Card } from '../generated/prisma/client'

export const cardRepository = {
  async findCards(): Promise<Card[]> {
    return await prisma.card.findMany({
      orderBy: {
        pokedexNumber: 'asc', // Tri croissant
      },
    })
  },
}
