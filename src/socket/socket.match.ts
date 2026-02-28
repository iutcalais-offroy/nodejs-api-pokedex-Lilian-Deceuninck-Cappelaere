import { Server, Socket } from 'socket.io'
import { decksService } from '../decks/decks.service'
import { Deck, Card } from '../generated/prisma/client'
import { calculateDamage } from '../utils/rules.util'

interface AuthenticatedSocket extends Socket {
  user: {
    userId: number
    email: string
  }
}

interface DeckWithCards extends Deck {
  cards: {
    card: Card
  }[]
}

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

/**
 * Fonction permettant de mélanger le deck
 * @param {Card[]} array - tableau des cartes du deck
 * @returns {Card[]} le tableau des cartes mélanger
 */
const shuffle = (array: Card[]): Card[] => {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

/**
 * Gère la création des room et les matchs
 * @param {Server} io - serveur socket.io
 */
export const matchMaking = (io: Server) => {
  let roomNum: number = 1
  const rooms: Room[] = []
  const players: Player[] = []
  const games: Game[] = []

  io.on('connection', (socket: Socket) => {
    // Utilisation de l'interface authentifiée pour accéder à socket.user
    const authSocket = socket as AuthenticatedSocket

    /**
     * Création d'une room
     */
    authSocket.on('createRoom', async (data: { deckId: number }) => {
      try {
        const deck = (await decksService.getDeckId(
          Number(data.deckId),
          authSocket.user.userId,
        )) as DeckWithCards

        // Récupération du nom des cartes avec typage explicite pour Prisma
        const nameCard = deck.cards.map(
          (item: { card: { name: string } }) => item.card.name,
        )

        // mélange des cartes
        const cards = shuffle(
          deck.cards.map((item: { card: Card }) => ({ ...item.card })),
        )

        const player1: Player = {
          socketId: authSocket.id,
          playerId: authSocket.user.userId,
          email: authSocket.user.email,
          deck: cards.slice(5),
          hand: cards.slice(0, 5),
          field: null,
          score: 0,
        }
        players.push(player1)

        const newRoom: Room = {
          roomId: String(roomNum),
          playerEmail: authSocket.user.email,
          deckId: deck.id,
          deckName: deck.name,
          nameCard: nameCard,
        }
        rooms.push(newRoom)

        authSocket.join(newRoom.roomId)

        authSocket.emit(
          'roomCreated',
          `infos de la Room n°${newRoom.roomId} : propriétaire (${newRoom.playerEmail}), deck (${newRoom.deckName} : ${newRoom.nameCard})`,
        )

        authSocket.broadcast.emit(
          'roomsListUpdated',
          'Liste des rooms disponible :',
          rooms,
        )
        roomNum += 1
      } catch (error: unknown) {
        if (error instanceof Error && error.message === 'DECK_INEXISTANT') {
          authSocket.emit('logs', `Le deck n°${data.deckId} n'existe pas`)
        }

        if (
          error instanceof Error &&
          error.message === 'DECK_AUTRE_UTILISATEUR'
        ) {
          authSocket.emit(
            'logs',
            `Le deck n°${data.deckId} ne vous appartient pas`,
          )
        }
      }
    })

    /**
     * Affiche la liste des room qui ne sont pas complete
     */
    authSocket.on('getRooms', () => {
      if (rooms.length == 0) {
        authSocket.emit('Aucune room disponible')
      } else {
        authSocket.emit('Liste des rooms disponible', rooms)
      }
    })

    /**
     * Permet de rejoindre une room
     */
    authSocket.on(
      'joinRoom',
      async (data: { roomId: string; deckId: number }) => {
        try {
          const deck = (await decksService.getDeckId(
            Number(data.deckId),
            authSocket.user.userId,
          )) as DeckWithCards

          const indexRoom = rooms.findIndex(
            (room) => room.roomId === data.roomId,
          )

          // Ajout des retours (return) pour corriger TS7030
          if (indexRoom === -1) {
            return authSocket.emit('error', "La room n'existe pas")
          }
          if (rooms[indexRoom].playerEmail === authSocket.user.email) {
            return authSocket.emit(
              'error',
              'Vous ne pouvez pas rejoindre votre propre room',
            )
          } else {
            // mélange des cartes avec typage correct
            const cards = shuffle(
              deck.cards.map((item: { card: Card }) => ({ ...item.card })),
            )

            const player2: Player = {
              socketId: authSocket.id,
              playerId: authSocket.user.userId,
              email: authSocket.user.email,
              deck: cards.slice(5),
              hand: cards.slice(0, 5),
              field: null,
              score: 0,
            }
            players.push(player2)

            authSocket.join(data.roomId)

            const player1 = players.find(
              (player) => player.email === rooms[indexRoom].playerEmail,
            )

            if (!player1) {
              return authSocket.emit('error', 'Joueur 1 introuvable')
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
                authSocket.emit(
                  'roomsListUpdated',
                  "Il n'y a plus de room disponible",
                )
              } else {
                io.emit(
                  'roomsListUpdated',
                  'Liste des rooms disponible :',
                  rooms,
                )
              }

              io.to(data.roomId).emit(
                'gameStarted',
                `La partie entre ${player1.email} et ${player2.email} commence`,
              )

              return gameState(newGame, 'gameStarted')
            }
          }
        } catch (error: unknown) {
          if (error instanceof Error && error.message === 'DECK_INEXISTANT') {
            authSocket.emit('logs', `Le deck n°${data.deckId} n'existe pas`)
          }

          if (
            error instanceof Error &&
            error.message === 'DECK_AUTRE_UTILISATEUR'
          ) {
            authSocket.emit(
              'logs',
              `Le deck n°${data.deckId} ne vous appartient pas`,
            )
          }
        }
      },
    )

    /**
     * Permer de piocher des cartes
     */
    authSocket.on('drawCards', async (data: { roomId: string }) => {
      const infos = gameAndTurn(data.roomId)

      if (!infos) {
        return
      }

      const { game, currentPlayer } = infos

      if (currentPlayer.hand.length === 5) {
        return authSocket.emit('error', 'Vous avez déjà 5 cartes')
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

    /**
     * Permet de jouer une carte
     */
    authSocket.on(
      'playCard',
      async (data: { roomId: string; cardIndex: number }) => {
        const infos = gameAndTurn(data.roomId)

        if (!infos) {
          return
        }

        const { game, currentPlayer } = infos

        if (currentPlayer.field !== null) {
          return authSocket.emit(
            'error',
            'Il y a déjà une carte sur votre terrain',
          )
        }

        if (data.cardIndex < 0 || data.cardIndex >= currentPlayer.hand.length) {
          return authSocket.emit(
            'error',
            "La carte n'existe pas cardIndex invalide",
          )
        }

        const cardPlay = currentPlayer.hand.splice(data.cardIndex, 1)[0]
        currentPlayer.field = cardPlay

        return gameState(game)
      },
    )

    /**
     * Permet d'attaquer
     */
    authSocket.on('attack', async (data: { roomId: string }) => {
      const infos = gameAndTurn(data.roomId)

      if (!infos) {
        return
      }

      const { game, currentPlayer, otherPlayer } = infos

      if (currentPlayer.field === null) {
        return authSocket.emit(
          'error',
          "Il n'y a aucune carte sur votre terrain",
        )
      }

      if (otherPlayer.field === null) {
        return authSocket.emit(
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
        games.splice(
          games.findIndex((game: Game) => game.gameId === data.roomId),
          1,
        )
        return
      }

      game.currentPlayerSocketId = otherPlayer.socketId
      gameState(game)
      return io
        .to(String(game.currentPlayerSocketId))
        .emit('Turn', "C'est à vous de jouer")
    })

    /**
     * Permet de terminer le tour
     */
    authSocket.on('endTurn', async (data: { roomId: string }) => {
      const infos = gameAndTurn(data.roomId)

      if (!infos) {
        return
      }

      const { game, otherPlayer } = infos

      game.currentPlayerSocketId = otherPlayer.socketId

      gameState(game)
      return io
        .to(String(game.currentPlayerSocketId))
        .emit('Turn', "C'est à vous de jouer")
    })

    /**
     * Vérifie la partie et le tour du joueur
     * @param {string} roomId - id de la room
     * @returns { game: Game, currentPlayer: Player, otherPlayer: Player } La partie, le joueur actif et l'autre jouer
     */
    function gameAndTurn(roomId: string): {
      game: Game
      currentPlayer: Player
      otherPlayer: Player
    } | void {
      const game = games.find((game: Game) => game.gameId === roomId)
      if (!game) {
        authSocket.emit('error', 'Partie introuvable')
        return
      }

      let currentPlayer: Player
      let otherPlayer: Player

      if (authSocket.user.userId === game.player1.playerId) {
        currentPlayer = game.player1
        otherPlayer = game.player2
      } else if (authSocket.user.userId === game.player2.playerId) {
        currentPlayer = game.player2
        otherPlayer = game.player1
      } else {
        authSocket.emit('error', "Vous n'êtes pas joueur à cette partie")
        return
      }

      if (game.currentPlayerSocketId !== currentPlayer.socketId) {
        authSocket.emit('error', "Ce n'est pas votre tour")
        return
      }

      return { game, currentPlayer, otherPlayer }
    }

    /**
     * Met en page les cartes pour l'affichage
     * @param {Card[] | Card | null} tabCards - Les cartes à mettre en page
     * @returns la liste des carte mise en page
     */
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

    /**
     * Permet la gestion sécurisé des messages vers les joueurs
     * @param {Game} game - La partie
     * @param {string | null} message - Un message si différent de gameStateUpdated
     */
    function gameState(game: Game, message?: string | null) {
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
        currentPlayerSocketId: game.currentPlayerSocketId,
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
        currentPlayerSocketId: game.currentPlayerSocketId,
      })
    }
  })
}
