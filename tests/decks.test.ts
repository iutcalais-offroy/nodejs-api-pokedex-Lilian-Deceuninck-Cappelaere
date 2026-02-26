import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { prismaMock } from './vitest.setup'
import { app } from '../src/index'
import { Card, Deck } from '../src/generated/prisma/client'
import jwt from 'jsonwebtoken'

const token = jwt.sign({ userId: 3, email: 'ash@exemple.com' }, 'Lilian')

describe('POST /api/decks/', () => {
  it('should return 201 for create deck', async () => {
    const newDeck = {
      id: 3,
      name: 'My Starter Deck',
      userId: 3,
    }

    // Mock d'un deck
    prismaMock.deck.create.mockResolvedValue(newDeck as Deck)

    // Mock des cartes
    prismaMock.card.findUnique.mockResolvedValue({
      id: 1,
      name: 'Bulbasaur',
    } as Card)

    const response = await request(app)
      .post('/api/decks/')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'My Starter Deck',
        cards: [1, 4, 7, 25, 2, 5, 8, 26, 3, 6],
      })

    expect(response.status).toBe(201)
  })

  it('should return 400 for missing deck name', async () => {
    const newDeck = {
      id: 3,
      name: 'My Starter Deck',
      userId: 3,
    }

    // Mock d'un deck
    prismaMock.deck.create.mockResolvedValue(newDeck as Deck)

    // Mock des cartes
    prismaMock.card.findUnique.mockResolvedValue({
      id: 1,
      name: 'Bulbasaur',
    } as Card)

    const response = await request(app)
      .post('/api/decks/')
      .set('Authorization', `Bearer ${token}`)
      .send({ cards: [1, 4, 7, 25, 2, 5, 8, 26, 3, 6] })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('error', 'Le nom du deck est manquant')
  })

  it('should return 400 for count of card not 10', async () => {
    const newDeck = {
      id: 3,
      name: 'My Starter Deck',
      userId: 3,
    }

    // Mock d'un deck
    prismaMock.deck.create.mockResolvedValue(newDeck as Deck)

    // Mock des cartes
    prismaMock.card.findUnique.mockResolvedValue({
      id: 1,
      name: 'Bulbasaur',
    } as Card)

    const response = await request(app)
      .post('/api/decks/')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'My Starter Deck',
        cards: [1, 4, 7, 25, 2, 5, 8, 26],
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty(
      'error',
      'Le deck doit contenir exactement 10 cartes',
    )
  })

  it('should return 400 for invalid card', async () => {
    const newDeck = {
      id: 3,
      name: 'My Starter Deck',
      userId: 3,
    }

    // Mock d'un deck
    prismaMock.deck.create.mockResolvedValue(newDeck as Deck)

    // Mock des cartes invalides
    prismaMock.card.findUnique.mockResolvedValue(null)

    const response = await request(app)
      .post('/api/decks/')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'My Starter Deck',
        cards: [1, 4, 7, 25, 2, 5, 8, 26, 0, 400],
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty(
      'error',
      'Un ou plusieurs numéros de cartes fournies sont invalides ou inexistant',
    )
  })

  it('should return 500 for server error', async () => {
    // Mock d'une erreur serveur
    prismaMock.deck.create.mockRejectedValue(new Error('Erreur serveur'))

    // Mock des cartes
    prismaMock.card.findUnique.mockResolvedValue({
      id: 1,
      name: 'Bulbasaur',
    } as Card)

    const response = await request(app)
      .post('/api/decks/')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'My Starter Deck',
        cards: [1, 4, 7, 25, 2, 5, 8, 26, 3, 6],
      })

    expect(response.status).toBe(500)
    expect(response.body).toHaveProperty('error', 'Erreur serveur')
  })
})

describe('GET /api/decks/mine', () => {
  it('should return 200 for deck list', async () => {
    const response = await request(app)
      .get('/api/decks/mine')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
  })

  it('should return 500 for server error', async () => {
    // Mock d'une erreur serveur
    prismaMock.deck.findMany.mockRejectedValue(new Error('Erreur serveur'))

    const response = await request(app)
      .get('/api/decks/mine')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(500)
    expect(response.body).toHaveProperty('error', 'Erreur serveur')
  })
})

describe('GET /api/decks/:id', () => {
  it('should return 200 for deck consultation', async () => {
    const mockDeck = {
      id: 3,
      userId: 3,
    }

    // Mock d'un deck
    prismaMock.deck.findUnique.mockResolvedValue(mockDeck as Deck)

    const response = await request(app)
      .get('/api/decks/3')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
  })

  it('should return 404 for inexistant deck', async () => {
    // Mock d'un deck inexistant
    prismaMock.deck.findUnique.mockResolvedValue(null)

    const response = await request(app)
      .get('/api/decks/3')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(404)
    expect(response.body).toHaveProperty('error', "Le deck n'existe pas")
  })

  it('should return 403 invalid user', async () => {
    const mockDeck = {
      id: 2,
      userId: 2,
    }

    // Mock d'un deck
    prismaMock.deck.findUnique.mockResolvedValue(mockDeck as Deck)

    const response = await request(app)
      .get('/api/decks/2')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(403)
    expect(response.body).toHaveProperty(
      'error',
      "Le deck n'appartient pas à l'utilisateur",
    )
  })

  it('should return 500 for server error', async () => {
    // Mock d'une erreur serveur
    prismaMock.deck.findUnique.mockRejectedValue(new Error('Erreur serveur'))

    const response = await request(app)
      .get('/api/decks/3')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(500)
    expect(response.body).toHaveProperty('error', 'Erreur serveur')
  })
})

describe('PATCH /api/decks/:id', () => {
  it('should return 200 for patch deck', async () => {
    const mockDeck = {
      id: 3,
      name: 'My Starter Deck',
      userId: 3,
    }

    // Mock d'un deck
    prismaMock.deck.findUnique.mockResolvedValue(mockDeck as Deck)

    // Mock des cartes
    prismaMock.card.findUnique.mockResolvedValue({
      id: 6,
      name: 'Charizard',
    } as Card)

    const response = await request(app)
      .patch('/api/decks/3')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Deck Name',
        cards: [6, 9, 12, 15, 18, 21, 24, 27, 30, 33],
      })

    expect(response.status).toBe(200)
  })

  it('should return 400 for missing deck name', async () => {
    const mockDeck = {
      id: 3,
      name: 'My Starter Deck',
      userId: 3,
    }

    // Mock d'un deck
    prismaMock.deck.findUnique.mockResolvedValue(mockDeck as Deck)

    // Mock des cartes
    prismaMock.card.findUnique.mockResolvedValue({
      id: 6,
      name: 'Charizard',
    } as Card)

    const response = await request(app)
      .patch('/api/decks/3')
      .set('Authorization', `Bearer ${token}`)
      .send({ cards: [6, 9, 12, 15, 18, 21, 24, 27, 30, 33] })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty('error', 'Le nom du deck est manquant')
  })

  it('should return 400 for count of card not 10', async () => {
    const mockDeck = {
      id: 3,
      name: 'My Starter Deck',
      userId: 3,
    }

    // Mock d'un deck
    prismaMock.deck.findUnique.mockResolvedValue(mockDeck as Deck)

    // Mock des cartes
    prismaMock.card.findUnique.mockResolvedValue({
      id: 6,
      name: 'Charizard',
    } as Card)

    const response = await request(app)
      .patch('/api/decks/3')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Deck Name',
        cards: [6, 9, 12, 15, 18, 21, 24, 27],
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty(
      'error',
      'Le deck doit contenir exactement 10 cartes',
    )
  })

  it('should return 404 for inexistant deck', async () => {
    // Mock d'un deck inexistant
    prismaMock.deck.findUnique.mockResolvedValue(null)

    // Mock des cartes
    prismaMock.card.findUnique.mockResolvedValue({
      id: 6,
      name: 'Charizard',
    } as Card)

    const response = await request(app)
      .patch('/api/decks/3')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Deck Name',
        cards: [6, 9, 12, 15, 18, 21, 24, 27, 30, 33],
      })

    expect(response.status).toBe(404)
    expect(response.body).toHaveProperty('error', "Le deck n'existe pas")
  })

  it('should return 400 for invalid card', async () => {
    const mockDeck = {
      id: 3,
      name: 'My Starter Deck',
      userId: 3,
    }

    // Mock d'un deck
    prismaMock.deck.findUnique.mockResolvedValue(mockDeck as Deck)

    // Mock des cartes invalides
    prismaMock.card.findUnique.mockResolvedValue(null)

    const response = await request(app)
      .patch('/api/decks/3')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Deck Name',
        cards: [6, 9, 12, 15, 18, 21, 24, 27, 30, 33],
      })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty(
      'error',
      'Un ou plusieurs numéros de cartes fournies sont invalides ou inexistant',
    )
  })

  it('should return 403 for invalid user', async () => {
    const mockDeck = {
      id: 2,
      name: 'My Starter Deck',
      userId: 2,
    }

    // Mock d'un deck
    prismaMock.deck.findUnique.mockResolvedValue(mockDeck as Deck)

    // Mock des cartes
    prismaMock.card.findUnique.mockResolvedValue({
      id: 6,
      name: 'Charizard',
    } as Card)

    const response = await request(app)
      .patch('/api/decks/3')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Deck Name',
        cards: [6, 9, 12, 15, 18, 21, 24, 27, 30, 33],
      })

    expect(response.status).toBe(403)
    expect(response.body).toHaveProperty(
      'error',
      "Le deck n'appartient pas à l'utilisateur",
    )
  })

  it('return 500 for server error', async () => {
    // Mock d'une erreur serveur
    prismaMock.deck.findUnique.mockRejectedValue(new Error('Erreur serveur'))

    // Mock des cartes
    prismaMock.card.findUnique.mockResolvedValue({
      id: 6,
      name: 'Charizard',
    } as Card)

    const response = await request(app)
      .patch('/api/decks/3')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Updated Deck Name',
        cards: [6, 9, 12, 15, 18, 21, 24, 27, 30, 33],
      })

    expect(response.status).toBe(500)
    expect(response.body).toHaveProperty('error', 'Erreur serveur')
  })
})

describe('DELETE /api/decks/:id', () => {
  it('should return 200 for delete deck', async () => {
    const mockDeck = {
      id: 3,
      name: 'My Starter Deck',
      userId: 3,
    }

    // Mock d'un deck
    prismaMock.deck.findUnique.mockResolvedValue(mockDeck as Deck)

    const response = await request(app)
      .delete('/api/decks/3')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
  })

  it('should return 404 for inexistant deck', async () => {
    // Mock d'un deck inexistant
    prismaMock.deck.findUnique.mockResolvedValue(null)

    const response = await request(app)
      .delete('/api/decks/3')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(404)
    expect(response.body).toHaveProperty('error', "Le deck n'existe pas")
  })

  it('should return 403 for invalid user', async () => {
    const mockDeck = {
      id: 2,
      name: 'My Starter Deck',
      userId: 2,
    }

    // Mock d'un deck
    prismaMock.deck.findUnique.mockResolvedValue(mockDeck as Deck)

    const response = await request(app)
      .delete('/api/decks/3')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(403)
    expect(response.body).toHaveProperty(
      'error',
      "Le deck n'appartient pas à l'utilisateur",
    )
  })

  it('return 500 for server error', async () => {
    // Mock d'une erreur serveur
    prismaMock.deck.findUnique.mockRejectedValue(new Error('Erreur serveur'))

    const response = await request(app)
      .delete('/api/decks/3')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(500)
    expect(response.body).toHaveProperty('error', 'Erreur serveur')
  })
})
