import { Socket } from 'socket.io'
import jwt from 'jsonwebtoken'

export const socketMiddleware = (
  socket: Socket,
  next: (error?: Error) => void,
) => {
  const token = socket.handshake.auth.token

  if (!token) {
    return next(new Error('Token manquant'))
  }

  try {
    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
      userId: number
      email: string
    }

    // Ajouter userId et email au socket
    socket.user = { userId: decoded.userId, email: decoded.email }

    // Passer au prochain middleware ou à la route
    next()
  } catch {
    next(new Error('Token invalide ou expiré'))
  }
}
