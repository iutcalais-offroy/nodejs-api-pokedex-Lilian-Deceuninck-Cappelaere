import { Server, Socket } from 'socket.io'
import { decksService } from '../decks/decks.service'
import { Card } from '../generated/prisma/client'
import { calculateDamage } from '../utils/rules.util'

interface Player {
  socketId: string
  playerId: number
  email: string
  deck: Card[]
  hand: Card[]
  field: Card | null
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
  gameId: string
  player1: Player
  player2: Player
  currentPlayerSocketId: string
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
        const cards = shuffle(
          deck.cards.map((carte: Card) => ({ ...carte.card })),
        )

        const player1: Player = {
          socketId: socket.id,
          playerId: socket.user.userId,
          email: socket.user.email,
          deck: cards.slice(5),
          hand: cards.slice(0, 5),
          field: null,
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
          const cards = shuffle(
            deck.cards.map((carte: Card) => ({ ...carte.card })),
          )

          const player2: Player = {
            socketId: socket.id,
            playerId: socket.user.userId,
            email: socket.user.email,
            deck: cards.slice(5),
            hand: cards.slice(0, 5),
            field: null,
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
              gameId: data.roomId,
              player1: player1,
              player2: player2,
              currentPlayerSocketId: player1.socketId,
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
              `La partie entre ${player1.email} et ${player2.email} commence au tour de ${newGame.currentPlayerSocketId}`,
            )

            gameState(newGame, 'gameStarted')
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

    socket.on('drawCards', async (data: { roomId: string }) => {
      const infos = gameAndTurn(data.roomId)

      if (!infos || typeof infos === 'boolean') {
        return
      }

      const { game, currentPlayer } = infos

      if (currentPlayer.hand.length === 5) {
        return socket.emit('error', 'Vous avez déjà 5 cartes')
      }

      while (currentPlayer.hand.length < 5 && currentPlayer.deck.length > 0) {
        const card = currentPlayer.deck.shift()

        if (card) {
          currentPlayer.hand.push(card)
        } else {
          return
        }
      }

      return gameState(game)
    })

    socket.on(
      'playCard',
      async (data: { roomId: string; cardIndex: number }) => {
        const infos = gameAndTurn(data.roomId)

        if (!infos || typeof infos === 'boolean') {
          return
        }

        const { game, currentPlayer } = infos

        if (currentPlayer.field !== null) {
          return socket.emit('error', 'Il y a déjà une carte sur votre terrain')
        }

        if (data.cardIndex < 0 || data.cardIndex >= currentPlayer.hand.length) {
          return socket.emit(
            'error',
            "La carte n'existe pas cardIndex invalide",
          )
        }

        const cardPlay = currentPlayer.hand.splice(data.cardIndex, 1)[0]
        currentPlayer.field = cardPlay

        return gameState(game)
      },
    )

    socket.on('attack', async (data: { roomId: string }) => {
      const infos = gameAndTurn(data.roomId)

      if (!infos || typeof infos === 'boolean') {
        return
      }

      const { game, currentPlayer, otherPlayer } = infos

      if (currentPlayer.field === null) {
        return socket.emit('error', "Il n'y a aucune carte sur votre terrain")
      }

      if (otherPlayer.field === null) {
        return socket.emit(
          'error',
          "Il n'y a aucune carte sur le terrain de votre adversaire",
        )
      }

      const damage = calculateDamage(
        currentPlayer.field.attack,
        currentPlayer.field.type,
        otherPlayer.field.type,
      )

      otherPlayer.field.hp -= damage

      io.to(data.roomId).emit(
        'combat',
        `${currentPlayer.field.name} attaque ${otherPlayer.field.name} et fait ${damage} dégâts`,
      )

      if (otherPlayer.field.hp <= 0) {
        currentPlayer.score += 1
        io.to(data.roomId).emit('combat', `${otherPlayer.field.name} et KO`)
        otherPlayer.field = null
      }

      if (currentPlayer.score === 3) {
        io.to(data.roomId).emit(
          'gameEnded',
          `Fin du jeu victoire de ${currentPlayer.email} 3 points à ${otherPlayer.score}`,
        )
        return games.splice(
          games.findIndex((game: Game) => game.gameId === data.roomId),
          1,
        )
      }

      game.currentPlayerSocketId = otherPlayer.socketId
      gameState(game)
      return io
        .to(String(game.currentPlayerSocketId))
        .emit('Turn', "C'est à vous de jouer")
    })

    socket.on('endTurn', async (data: { roomId: string }) => {
      const infos = gameAndTurn(data.roomId)

      if (!infos || typeof infos === 'boolean') {
        return
      }

      const { game, otherPlayer } = infos

      game.currentPlayerSocketId = otherPlayer.socketId

      gameState(game)
      return io
        .to(String(game.currentPlayerSocketId))
        .emit('Turn', "C'est à vous de jouer")
    })

    // Vérifie la partie et le tour du joueur
    function gameAndTurn(roomId: string) {
      const game = games.find((game: Game) => game.gameId === roomId)
      if (!game) {
        return socket.emit('error', 'Partie introuvable')
      }

      let currentPlayer: Player
      let otherPlayer: Player

      if (socket.user.userId === game.player1.playerId) {
        currentPlayer = game.player1
        otherPlayer = game.player2
      } else if (socket.user.userId === game.player2.playerId) {
        currentPlayer = game.player2
        otherPlayer = game.player1
      } else {
        return socket.emit('error', "Vous n'êtes pas joueur à cette partie")
      }

      if (game.currentPlayerSocketId !== currentPlayer.socketId) {
        return socket.emit('error', "Ce n'est pas votre tour")
      }

      return { game, currentPlayer, otherPlayer }
    }

    function cardsLabel(tabCards: Card[] | Card | null) {
      // field vide
      if (tabCards === null) {
        return null
      }

      // hand
      if (Array.isArray(tabCards)) {
        return tabCards.map((carte) => ({
          nom_du_pokemon: carte.name,
          hp: carte.hp,
          attaque: carte.attack,
          type: carte.type,
        }))
      }

      // field
      return {
        nom_du_pokemon: tabCards.name,
        hp: tabCards.hp,
        attaque: tabCards.attack,
        type: tabCards.type,
      }
    }

    function gameState(game: Game, message?: string) {
      const messageEmit: string = message || 'gameStateUpdated'

      // Joueur 1
      io.to(String(game.player1.socketId)).emit(messageEmit, {
        vous: {
          main: cardsLabel(game.player1.hand),
          terrain: cardsLabel(game.player1.field),
          score: game.player1.score,
        },
        'votre adversaire': {
          nombre_carte_en_main: game.player2.hand.length,
          terrain: cardsLabel(game.player2.field),
          score: game.player2.score,
        },
        tour: `tour du joueur ${game.currentPlayerSocketId}`,
      })

      if (messageEmit === 'gameStarted') {
        io.to(String(game.player1.socketId)).emit(
          messageEmit,
          "C'est à vous de commencer",
        )
      }

      // Joueur 2
      io.to(String(game.player2.socketId)).emit(messageEmit, {
        vous: {
          main: cardsLabel(game.player2.hand),
          terrain: cardsLabel(game.player2.field),
          score: game.player2.score,
        },
        'votre adversaire': {
          nombre_carte_en_main: game.player1.hand.length,
          terrain: cardsLabel(game.player1.field),
          score: game.player1.score,
        },
        tour: `tour du joueur ${game.currentPlayerSocketId}`,
      })
    }
  })
}
