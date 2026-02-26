import { Deck } from '../generated/prisma/client'
import { decksRepository } from './decks.repository'

export const decksService = {
  /**
   * Validation des cartes et création du deck
   * @param {string} name - nom du deck
   * @param {number} userId - id de l'utilisateur
   * @param {number[]} cards - tableau des cartes du deck
   * @throws {Error('CARDS_INVALIDE')} - en cas de carte invalide
   * @returns {Promise<Deck>} le deck
   */
  async creationDecks(
    name: string,
    userId: number,
    cards: number[],
  ): Promise<Deck> {
    const valide: boolean = await decksRepository.valideCard(cards)

    // Erreur si la carte n'est pas valide
    if (!valide) {
      throw new Error('CARDS_INVALIDE')
    }

    // Envoie les données à decksRepository pour la création en base de données et retourne le résultat
    return await decksRepository.creationDecks(name, userId, cards)
  },

  /**
   * Fait appel à deckRepository pour récupérer la liste des decks
   * @param {number} userId - id de l'utilisateur
   * @returns {Promise<Deck[]>} la liste des decks
   */
  async getDecks(userId: number): Promise<Deck[]> {
    return await decksRepository.findManyDecks(userId)
  },

  /**
   * Fait appel à deckRepository pour récupérer le deck demander
   * @param {number} id - id du deck
   * @param {number} userId - id de l'utilisateur
   * @throws {Error('DECK_INEXISTANT')} si le deck est inexistant
   * @throws {Error('DECK_AUTRE_UTILISATEUR')} si le deck appartient à un autre utilisateur
   * @returns {Promise<Deck>} le deck recherché
   */
  async getDeckId(id: number, userId: number): Promise<Deck> {
    const deck = await decksRepository.findOneDeck(id)

    // Si le deck est inexistant
    if (!deck) {
      throw new Error('DECK_INEXISTANT')
    }

    // Si le deck appartient à un autre utilisateur
    if (deck.userId !== userId) {
      throw new Error('DECK_AUTRE_UTILISATEUR')
    }

    return deck
  },

  /**
   * Fait appel à deckRepository pour modifier le deck
   * @param {number} id - id du deck
   * @param {string} name - nom du deck
   * @param {number} userId - id de l'utilisateur
   * @param {number[]} cards - tableau des cartes du deck
   * @throws {Error('CARDS_INVALIDE')} si une ou plusieurs cartes ne sont pas valides
   * @throws {Error('DECK_INEXISTANT')} si le deck n'existe pas
   * @throws {Error('DECK_AUTRE_UTILISATEUR')} si le deck appartient à un autre utilisateur
   * @returns {Promise<Deck>} le deck modifier
   */
  async patchDeck(
    id: number,
    name: string,
    userId: number,
    cards: number[],
  ): Promise<Deck> {
    const valide: boolean = await decksRepository.valideCard(cards)

    // Si une ou plusieurs cartes ne sont pas valides
    if (!valide) {
      throw new Error('CARDS_INVALIDE')
    }

    const deck = await decksRepository.findOneDeck(id)

    // Si le deck n'existe pas
    if (!deck) {
      throw new Error('DECK_INEXISTANT')
    }

    // Si le deck appartient à un autre utilisateur
    if (deck.userId !== userId) {
      throw new Error('DECK_AUTRE_UTILISATEUR')
    }

    return await decksRepository.modifDeck(id, name, cards)
  },

  /**
   * Fait appel à deckRepository pour supprimer le deck
   * @param {number} id - id du deck
   * @returns {Promise<Deck>} le deck supprimer
   */
  async deleteDeck(id: number): Promise<Deck> {
    return await decksRepository.supprDeck(id)
  },
}
