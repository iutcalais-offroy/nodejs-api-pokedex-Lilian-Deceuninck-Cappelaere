import { cardRepository } from './card.repository';

export const cardsService = {
    async getCards() {
        return await cardRepository.findCards();
    }
};