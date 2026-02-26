import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

interface userIdRequest extends Request {
  userId?: number
}

/**
 * Middleware d'authentification pour sécuriser les routes gère le Token JWT
 * @param {userIdRequest} req - importer de express et étendu par userIdRequest permet de récupérer le userId de l'utilisateur
 * @param {Response} res - importer de express permet de récupérer les données venant du serveur
 * @param {NextFunction} next - permet de passer au middleware suivant
 * @returns si token valide ajoute le userId à la requête qui la demander, 401 si token manquant, 403 si token invalide ou expiré
 */
export const authenticateToken = (
  req: userIdRequest,
  res: Response,
  next: NextFunction,
) => {
  // Récupérer le token depuis l'en-tête Authorization
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1] // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: 'Token manquant' })
  }

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number
      email: string
    }

    // Ajouter userId à la requête pour l'utiliser dans les routes
    req.user = { userId: decoded.userId }

    // Passer au prochain middleware ou à la route
    next()
  } catch {
    res.status(403).json({ error: 'Token invalide ou expiré' })
  }

  return
}
