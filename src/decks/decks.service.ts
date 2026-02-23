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
}
