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

  async findManyDecks(userId: number): Promise<Deck[]> {
    return await prisma.deck.findMany({
      where: { userId },
      include: { cards: { include: { card: true } } },
    })
  },

  async findOneDeck(id: number): Promise<Deck | null> {
    return await prisma.deck.findUnique({
      where: { id },
      include: { cards: { include: { card: true } } },
    })
  },

  async modifDeck(id: number, name: string, cards: number[]): Promise<Deck> {
    return await prisma.deck.update({
      where: { id },
      data: {
        ...(name && { name }),
        cards: {
          deleteMany: {},
          create: cards.map((id) => ({ cardId: id })),
        },
      },
    })
  },

  async supprDeck(id: number): Promise<Deck> {
    await prisma.deckCard.deleteMany({
      where: { deckId: id },
    })

    return await prisma.deck.delete({
      where: { id },
    })
  },
}
