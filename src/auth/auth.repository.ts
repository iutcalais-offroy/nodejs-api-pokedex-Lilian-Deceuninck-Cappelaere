import prisma from '../database'
import { User } from '../generated/prisma/client'

export const authRepository = {
  /**
   * Recherche un utilisateur à partir de son email
   * @param {string} email - L'email de l'utilisateur
   * @returns {Promise<User | null>} retourne l'utilisateur si réussi null sinon
   */
  async findUserByEmail(email: string): Promise<User | null> {
    // Vérifier si l'utilisateur existe déjà
    return await prisma.user.findUnique({
      where: { email },
    })
  },

  /**
   * Crée un utilisateur
   * @param {string} username - Le nom d'utilisateur
   * @param {string} email - l'email
   * @param {string} hashedPassword - Le mot de passe
   * @returns {Promise<{ id: number; username: string; email: string; }>} retourne l'id, l'username et l'email de l'utilisateur
   */
  async createUser(
    username: string,
    email: string,
    hashedPassword: string,
  ): Promise<{ id: number; username: string; email: string }> {
    // Création de l'user
    return await prisma.user.create({
      data: { username, email, password: hashedPassword },
      select: {
        id: true,
        username: true,
        email: true,
      },
    })
  },
}
