import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { authRepository } from './auth.repository'

export const authService = {
  /**
   * Inscription : hachage du mot de passe, création de l'utilisateur et du Token JWT
   * @param {string} email - l'email
   * @param {string} username - Le nom d'utilisateur
   * @param {string} password - Le mot de passe
   * @throws {error} EMAIL_ALREADY_USED - Si l'email est déjà utilisé
   * @returns {Promise<{ user: { id: number; username: string; email: string} token: string }>} Un JSON contenant l'utilisateur et son Token JWT
   */
  async signUp(
    email: string,
    username: string,
    password: string,
  ): Promise<{
    user: { id: number; username: string; email: string }
    token: string
  }> {
    const mail = await authRepository.findUserByEmail(email)

    // Si l'email existe déjà
    if (mail) {
      throw new Error('EMAIL_ALREADY_USED')
    }

    // Hache le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Envoie les données à authRepository pour la création en base de données
    const user = await authRepository.createUser(
      username,
      email,
      hashedPassword,
    )

    // Générer le JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }, // Le token expire dans 7 jours
    )

    return { user, token }
  },

  /**
   * Connection : Vérifie les identifiants et génère le Token JWT
   * @param {string} email - l'email
   * @param {string} password - le mot de passe
   * @returns {Promise<{ user: { id: number; username: string; email: string } token: string }>} Un JSON contenant l'utilisateur et le Token JWT
   */
  async signIn(
    email: string,
    password: string,
  ): Promise<{
    user: { id: number; username: string; email: string }
    token: string
  }> {
    const user = await authRepository.findUserByEmail(email)

    // Vérifier que l'utilisateur existe
    if (!user) {
      throw new Error('INVALID_CREDENTIALS')
    }

    const isPasswordValid = await bcrypt.compare(password, user.password)

    // Vérifier le mot de passe
    if (!isPasswordValid) {
      throw new Error('INVALID_CREDENTIALS')
    }

    // Générer le JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }, // Le token expire dans 7 jours
    )

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      token,
    }
  },
}
