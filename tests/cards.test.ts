import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { prismaMock } from './vitest.setup'
import { app } from '../src/index'

describe('GET /api/cards/', () => {
  it('should return 200 for card list', async () => {
    const response = await request(app).get('/api/cards/')

    expect(response.status).toBe(200)
  })

  it('should return 500 for server error', async () => {
    // Mock d'une erreur serveur
    prismaMock.card.findMany.mockRejectedValue(new Error('Erreur serveur'))

    const response = await request(app).get('/api/cards/')

    expect(response.status).toBe(500)
    expect(response.body).toHaveProperty('error', 'Erreur serveur')
  })
})
