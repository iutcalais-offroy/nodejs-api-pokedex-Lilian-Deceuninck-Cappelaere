import { describe, expect, it } from 'vitest'
import request from 'supertest'
import { prismaMock } from './vitest.setup'
import { app } from '../src/index'
import { User } from '../src/generated/prisma/client'
import bcrypt from 'bcrypt'

describe('POST api/auth/sign-up', () => {
  it('should return 201 for create a new user', async () => {
    const newUser = {
      id: 3,
      email: 'ash@example.com',
      username: 'ash',
      password: 'hashedpassword',
    }

    // Mock d'une création valide
    prismaMock.user.create.mockResolvedValue(newUser as User)

    const response = await request(app).post('/api/auth/sign-up').send({
      email: 'ash@example.com',
      username: 'ash',
      password: 'password123',
    })

    expect(response.status).toBe(201)
    expect(response.body).toHaveProperty(
      'message',
      "Création de l'utilisateur réussie",
    )
    expect(response.body).toHaveProperty('token')
    expect(response.body.user).toHaveProperty('username', 'ash')
  })

  it('should return 400 for invalid data', async () => {
    // Mock d'une erreur données incomplètes
    prismaMock.user.create.mockRejectedValue(
      new Error('Les données sont incomplètes'),
    )

    const response = await request(app)
      .post('/api/auth/sign-up')
      .send({ username: 'ash' })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty(
      'error',
      'Les données sont incomplètes',
    )
  })

  it('should return 409 for email already used', async () => {
    // Mock d'une erreur email déjà utilisé
    prismaMock.user.findUnique.mockResolvedValue({ id: 1 } as User)

    const response = await request(app).post('/api/auth/sign-up').send({
      email: 'ash@example.com',
      username: 'ash',
      password: 'password123',
    })

    expect(response.status).toBe(409)
    expect(response.body).toHaveProperty('error', 'Email déjà utilisé')
  })

  it('should return 500 for server error', async () => {
    // Mock d'une erreur serveur
    prismaMock.user.findUnique.mockRejectedValue(new Error('Erreur serveur'))

    const response = await request(app).post('/api/auth/sign-up').send({
      email: 'ash@example.com',
      username: 'ash',
      password: 'password123',
    })

    expect(response.status).toBe(500)
    expect(response.body).toHaveProperty('error', 'Erreur serveur')
  })
})

describe('POST api/auth/sign-in', () => {
  it('should return 200 for connect user', async () => {
    const mockUser = {
      id: 1,
      email: 'ash@example.com',
      username: 'ash',
      password: await bcrypt.hash('password123', 10),
    }

    // Mock d'une connection valide
    prismaMock.user.findUnique.mockResolvedValue(mockUser as User)

    const response = await request(app).post('/api/auth/sign-in').send({
      email: 'ash@example.com',
      password: 'password123',
    })

    expect(response.status).toBe(200)
    expect(response.body).toHaveProperty('message', 'Connexion réussie')
  })

  it('should return 401 for invalid email', async () => {
    // Mock Email incorrect
    prismaMock.user.findUnique.mockResolvedValue(null)

    const response = await request(app).post('/api/auth/sign-in').send({
      email: '@example.com',
      password: 'password123',
    })

    expect(response.status).toBe(401)
    expect(response.body).toHaveProperty(
      'error',
      'Email ou mot de passe incorrect',
    )
  })

  it('should return 401 for invalid password', async () => {
    const mockUser = {
      id: 1,
      email: 'ash@example.com',
      username: 'ash',
      password: await bcrypt.hash('password123', 10),
    }

    // Mock d'une connection valide pour tester le mot de passe incorrect
    prismaMock.user.findUnique.mockResolvedValue(mockUser as User)

    const response = await request(app).post('/api/auth/sign-in').send({
      email: 'red@example.com',
      password: '123',
    })

    expect(response.status).toBe(401)
    expect(response.body).toHaveProperty(
      'error',
      'Email ou mot de passe incorrect',
    )
  })

  it('should return 400 for invalid data', async () => {
    const mockUser = {
      id: 1,
      email: 'ash@example.com',
      username: 'ash',
      password: await bcrypt.hash('password123', 10),
    }

    // Mock d'une connection valide pour tester les données incomplètes
    prismaMock.user.findUnique.mockResolvedValue(mockUser as User)

    const response = await request(app).post('/api/auth/sign-in').send({
      password: 'password123',
    })

    expect(response.status).toBe(400)
    expect(response.body).toHaveProperty(
      'error',
      'Les données sont incomplètes',
    )
  })

  it('should return 500 for server error', async () => {
    // Mock d'une erreur serveur
    prismaMock.user.findUnique.mockRejectedValue(new Error('Erreur serveur'))

    const response = await request(app).post('/api/auth/sign-in').send({
      email: 'ash@example.com',
      password: 'password123',
    })

    expect(response.status).toBe(500)
    expect(response.body).toHaveProperty('error', 'Erreur serveur')
  })
})
