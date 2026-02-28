import { Server, Socket } from 'socket.io'
import { decksService } from '../decks/decks.service'
import { Card } from '../generated/prisma/client'

interface Player {
  playerId: number
  email: string
  deck: Card[]
  hand: Card[]
  field: Card | null
  fight: number | null
  HP: number | null
  score: number
}

interface Room {
  roomId: string
  playerEmail: string
  deckId: number
  deckName: string
  nameCard: string[]
}

interface Game {
  gameId: number
  player1: Player
  player2: Player
  turn: number
}

// Fonction pour mélanger le deck
const shuffle = (array: []) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}

export const matchMaking = (io: Server) => {
  let roomNum: number = 1
  const rooms: Room[] = []
  const players: Player[] = []
  const games: Game[] = []

  io.on('connection', (socket: Socket) => {
    socket.on('createRoom', async (data: { deckId: number }) => {
      try {
        const deck = await decksService.getDeckId(
          Number(data.deckId),
          socket.user.userId,
        )

        // Récupération du nom des cartes
        const nameCard = deck.cards.map((carte: string) => carte.card.name)

        // mélange des cartes
        const cards = shuffle(deck.cards.map((carte: Card) => carte.card))

        const player1: Player = {
          playerId: socket.user.userId,
          email: socket.user.email,
          deck: cards.slice(5),
          hand: cards.slice(0, 5),
          field: null,
          fight: null,
          HP: null,
          score: 0,
        }
        players.push(player1)

        const newRoom: Room = {
          roomId: String(roomNum),
          playerEmail: socket.user.email,
          deckId: deck.id,
          deckName: deck.name,
          nameCard: nameCard,
        }
        rooms.push(newRoom)

        socket.join(newRoom.roomId)

        socket.emit(
          'roomCreated',
          `infos de la Room n°${newRoom.roomId} : propriétaire (${newRoom.playerEmail}), deck (${newRoom.deckName} : ${newRoom.nameCard})`,
        )

        socket.broadcast.emit(
          'roomsListUpdated',
          'Liste des rooms disponible :',
          rooms,
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

        const indexRoom = rooms.findIndex((room) => room.roomId === data.roomId)

        if (indexRoom === -1) {
          socket.emit('error', "La room n'existe pas")
        }
        if (rooms[indexRoom].playerEmail === socket.user.email) {
          socket.emit('error', 'Vous ne pouvez pas rejoindre votre propre room')
        } else {
          // mélange des cartes
          const cards = shuffle(deck.cards.map((carte: Card) => carte.card))

          const player2: Player = {
            playerId: socket.user.userId,
            email: socket.user.email,
            deck: cards.slice(5),
            hand: cards.slice(0, 5),
            field: null,
            fight: null,
            HP: null,
            score: 0,
          }
          players.push(player2)

          socket.join(data.roomId)

          const player1 = players.find(
            (player) => player.email === rooms[indexRoom].playerEmail,
          )

          if (!player1) {
            socket.emit('error', 'Joueur 1 introuvable')
          } else {
            const newGame: Game = {
              gameId: Number(data.roomId),
              player1: player1,
              player2: player2,
              turn: 1,
            }
            games.push(newGame)

            rooms.splice(indexRoom, 1)

            if (rooms.length == 0) {
              socket.emit(
                'roomsListUpdated',
                "Il n'y a plus de room disponible",
              )
            } else {
              io.emit('roomsListUpdated', 'Liste des rooms disponible :', rooms)
            }

            io.to(data.roomId).emit(
              'gameStarted',
              `La partie entre ${player1.email} et ${player2.email} commence`,
            )
            socket
              .to(data.roomId)
              .emit(
                'hand',
                `Votre main (nom du pokemon, hp, attaque, type) : ${player1.hand.map((carte) => [carte.name, carte.hp, carte.attack, carte.type]).join('; ')}`,
              )
            socket.emit(
              'hand',
              `Votre main (nom du pokemon, hp, attaque, type) : ${player2.hand.map((carte) => [carte.name, carte.hp, carte.attack, carte.type]).join('; ')}`,
            )
          }
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
