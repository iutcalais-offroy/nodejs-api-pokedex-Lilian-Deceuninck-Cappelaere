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

    socket.on('getRooms', () => {
      if (rooms.length == 0) {
        socket.emit('Aucune room disponible')
      } else {
        socket.emit('Liste des rooms disponible', rooms)
      }
    })

    socket.on('joinRoom', async (data: { roomId: string; deckId: number }) => {
      try {
        const deck = await decksService.getDeckId(
          Number(data.deckId),
          socket.user.userId,
        )

        const indexRoom = rooms.findIndex((roomId) =>
          roomId.startsWith(`Room n°${data.roomId}`),
        )

        if (indexRoom === -1) {
          socket.emit('error', "La room n'existe pas")
        } else {
          socket.join(data.roomId)
          socket.emit(`${Number(data.roomId) - 1}`)

          rooms.splice(indexRoom, 1)

          io.to(data.roomId).emit('gameStarted', 'La partie commence')

          socket.broadcast.emit(
            'roomsListUpdated',
            `Liste des rooms disponible : [${rooms}]`,
          )
        }
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
