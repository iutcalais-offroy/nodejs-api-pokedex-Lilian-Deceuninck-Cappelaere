import { Server, Socket } from 'socket.io'
// import prisma from "../database";
import { decksService } from '../decks/decks.service'

export const matchMaking = (io: Server) => {
  let roomNum: number = 1
  const rooms: string[] = []
  io.on('connection', (socket: Socket) => {
    socket.on('createRoom', async (data: { deckId: number }) => {
      try {
        const deck = await decksService.getDeckId(
          Number(data.deckId),
          socket.user.userId,
        )
        const cartes = deck.cards.map((card: number) => card.cardId)

        socket.join(String(roomNum))

        socket.emit(
          'roomCreated',
          `infos de la Room n°${roomNum} : propriétaire (${socket.user.email}), deck (${deck.name} : ${cartes})`,
        )
        rooms.push(
          `Room n°${roomNum} : propriétaire(${socket.user.email}), deck(${deck.name} : ${cartes}`,
        )
        socket.broadcast.emit(
          'roomsListUpdated',
          `Liste des rooms disponible : [${rooms}]`,
        )
        roomNum += 1
      } catch (error: unknown) {
        if (error instanceof Error && error.message === 'DECK_INEXISTANT') {
          socket.emit('logs', `Le deck n°${data.deckId} n'existe pas`)
        }

        if (
          error instanceof Error &&
          error.message === 'DECK_AUTRE_UTILISATEUR'
        ) {
          socket.emit('logs', `Le deck n°${data.deckId} ne vous appartient pas`)
        }
      }
    })
  })
}
