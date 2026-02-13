import { Request, Response } from 'express'
import { authService } from './auth.service'

export const authController = {
  async signUp(req: Request, res: Response): Promise<Response> {
    const { email, username, password } = req.body
    try {
      // Vérifier que les données sont complètes
      if (!email || !username || !password) {
        return res.status(400).json({ error: 'Les données sont incomplètes' })
      }

      const { user, token } = await authService.signUp(
        email,
        username,
        password,
      )

      // Retourner le token
      return res.status(201).json({
        message: "Création de l'utilisateur réussie",
        token,
        user,
      })
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'EMAIL_ALREADY_USED') {
        return res.status(409).json({ error: 'Email déjà utilisé' })
      }
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  },

  async signIn(req: Request, res: Response): Promise<Response> {
    const { email, password } = req.body

    try {
      // Vérifier que les données sont complètes
      if (!email || !password) {
        return res.status(400).json({ error: 'Les données sont incomplètes' })
      }

      const { user, token } = await authService.signIn(email, password)

      // Retourner le token
      return res.status(200).json({
        message: 'Connexion réussie',
        token,
        user,
      })
    } catch (error: unknown) {
      if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
        return res
          .status(401)
          .json({ error: 'Email ou mot de passe incorrect' })
      }
      return res.status(500).json({ error: 'Erreur serveur' })
    }
  },
}
