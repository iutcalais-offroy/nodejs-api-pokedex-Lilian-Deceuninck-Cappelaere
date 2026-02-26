import prisma from '../database'
import { Deck } from '../generated/prisma/client'

export const decksRepository = {
  /**
   * Teste la validité des cartes du deck
   * @param {number[]} cards - tableau des cartes du deck
   * @returns {Promise<boolean>} true si toutes les cartes sont valides false sinon
   */
  async valideCard(cards: number[]): Promise<boolean> {
    for (let index = 0; index < cards.length; index++) {
      // Test de l’existence de la carte
      if (!(await prisma.card.findUnique({ where: { id: cards[index] } }))) {
        return false
      }
    }

    // Si toutes les cartes existes
    return true
  },

  /**
   * Crée le deck en base de données
   * @param {string} name - le nom du deck
   * @param {number} userId - id de l'utilisateur
   * @param {number[]} cards - tableau des cartes du deck
   * @returns {Promise<Deck>} le deck créé en base de données
   */
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

  /**
   * Cherche dans le base de données la liste des decks appartenant à l'utilisateur
   * @param {number} userId
   * @returns {Promise<Deck[]>} la liste des decks
   */
  async findManyDecks(userId: number): Promise<Deck[]> {
    return await prisma.deck.findMany({
      where: { userId },
      include: { cards: { include: { card: true } } },
    })
  },

  /**
   * Cherche dans le base de données le deck demandé appartenant à l'utilisateur
   * @param {number} id - id du deck
   * @returns {Promise<Deck | null>} le deck si trouvé null sinon
   */
  async findOneDeck(id: number): Promise<Deck | null> {
    return await prisma.deck.findUnique({
      where: { id },
      include: { cards: { include: { card: true } } },
    })
  },

  /**
   * Modifie dans le base de données le deck demandé appartenant à l'utilisateur
   * @param {number} id - id du deck
   * @param {string} name - le nom du deck
   * @param {number[]} cards - tableau des cartes du deck
   * @returns {Promise<Deck>} le deck modifier
   */
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

  /**
   * Supprime dans le base de données le deck demandé appartenant à l'utilisateur
   * @param {number} id - id du deck
   * @returns {Promise<Deck>} le deck supprimé
   */
  async supprDeck(id: number): Promise<Deck> {
    // Supprime les associations de cartes avec le deck
    await prisma.deckCard.deleteMany({
      where: { deckId: id },
    })

    // Supprime le deck
    return await prisma.deck.delete({
      where: { id },
    })
  },
}
