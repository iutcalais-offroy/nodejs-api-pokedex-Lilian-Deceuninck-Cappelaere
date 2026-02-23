import { decksRepository } from './decks.repository'

export const decksService = {
  async creationDecks(name: string, userId: number, cards: number[]) {
    const valide: boolean = await decksRepository.valideCard(cards)

    if (!valide) {
      throw new Error('CARDS_INVALIDE')
    }

    return await decksRepository.creationDecks(name, userId, cards)
  },
}
