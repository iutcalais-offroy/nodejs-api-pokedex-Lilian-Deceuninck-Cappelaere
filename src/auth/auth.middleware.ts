import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'

interface userIdRequest extends Request {
  userId?: number
}

export const authenticateToken = (
  req: userIdRequest,
  res: Response,
  next: NextFunction,
) => {
  // Récupérer le token depuis l'en-tête Authorization
  const authHeader = req.headers.authorization
  const token = authHeader && authHeader.split(' ')[1] // Format: "Bearer TOKEN"

  if (!token) {
    res.status(401).json({ error: 'Token manquant' })
    return
  }

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number
      email: string
    }

    // Ajouter userId à la requête pour l'utiliser dans les routes
    req.userId = decoded.userId

    // Passer au prochain middleware ou à la route
    next()
  } catch (error: unknown) {
    if (error instanceof Error) {
      res.status(403).json({ error: 'Token invalide ou expiré' })
    }
    return
  }
}
