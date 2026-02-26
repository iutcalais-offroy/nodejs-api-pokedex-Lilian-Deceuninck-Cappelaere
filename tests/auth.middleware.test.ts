import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { app } from '../src/index'
import jwt from 'jsonwebtoken'

describe('Token', () => {
  it('should return 200 for token valid', async () => {
    // token
    const token = jwt.sign({ userId: 3, email: 'ash@exemple.com' }, 'Lilian')

    const response = await request(app)
      .get('/api/decks/mine')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(200)
  })

  it('should return 401 for missing token', async () => {
    const response = await request(app).get('/api/decks/mine')

    expect(response.status).toBe(401)
    expect(response.body).toHaveProperty('error', 'Token manquant')
  })

  it('should return 403 for invalid token', async () => {
    // faux token
    const token = 'token'

    const response = await request(app)
      .get('/api/decks/mine')
      .set('Authorization', `Bearer ${token}`)

    expect(response.status).toBe(403)
    expect(response.body).toHaveProperty('error', 'Token invalide ou expiré')
  })
})
