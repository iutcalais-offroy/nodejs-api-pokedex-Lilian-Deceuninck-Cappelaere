import { Deck } from '../generated/prisma/client'
import { decksRepository } from './decks.repository'

export const decksService = {
  async creationDecks(
    name: string,
    userId: number,
    cards: number[],
  ): Promise<Deck> {
    const valide: boolean = await decksRepository.valideCard(cards)

    if (!valide) {
      throw new Error('CARDS_INVALIDE')
    }

    return await decksRepository.creationDecks(name, userId, cards)
  },

  async getDecks(userId: number): Promise<JSON> {
    return await decksRepository.findManyDecks(userId)
  },

  async getDeckId(id: number, userId: number): Promise<JSON> {
    const deck = await decksRepository.findOneDeck(id)

    if (!deck) {
      throw new Error('DECK_INEXISTANT')
    }

    if (deck.userId !== userId) {
      throw new Error('DECK_AUTRE_UTILISATEUR')
    }

    return deck
  },

  async patchDeck(
    id: number,
    name: string,
    userId: number,
    cards: number[],
  ): Promise<Deck> {
    const valide: boolean = await decksRepository.valideCard(cards)

    if (!valide) {
      throw new Error('CARDS_INVALIDE')
    }

    const deck = await decksRepository.findOneDeck(id)

    if (!deck) {
      throw new Error('DECK_INEXISTANT')
    }

    if (deck.userId !== userId) {
      throw new Error('DECK_AUTRE_UTILISATEUR')
    }

    return await decksRepository.modifDeck(id, name, cards)
  },

  async deleteDeck(id: number, userId: number): Promise<Deck> {
    const deck = await decksRepository.findOneDeck(id)

    if (!deck) {
      throw new Error('DECK_INEXISTANT')
    }

    if (deck.userId !== userId) {
      throw new Error('DECK_AUTRE_UTILISATEUR')
    }

    return await decksRepository.supprDeck(id)
  },
}
