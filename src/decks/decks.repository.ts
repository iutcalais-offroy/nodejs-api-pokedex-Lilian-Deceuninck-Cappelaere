import prisma from '../database'
import { Deck } from '../generated/prisma/client'

export const decksRepository = {
  async valideCard(cards: number[]): Promise<boolean> {
    for (let index = 0; index < cards.length; index++) {
      // Test de l’existence de la carte
      if (!(await prisma.card.findUnique({ where: { id: cards[index] } }))) {
        return false
      }
    }

    // Si toute les cartes existes
    return true
  },

  async creationDecks(
    name: string,
    userId: number,
    cards: number[],
  ): Promise<Deck> {
    return await prisma.deck.create({
      data: {
        name: name,
        userId: userId,
        cards: {
          create: cards.map((id) => ({ cardId: id })),
        },
      },
    })
  },
}
