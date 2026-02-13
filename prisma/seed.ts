import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { join } from 'path'
import prisma from '../src/database'
import { CardModel } from '../src/generated/prisma/models/Card'
import { PokemonType } from '../src/generated/prisma/enums'

// Fonction pour récupérer un tableau de numéro de cartes afin de créer un deck
async function getTabCards(
  nbCardsDeck: number,
  nbCardsPokemonData: number,
): Promise<number[]> {
  // Création d'un tableau de number
  const tabIdCards: number[] = []

  // ajout dans le tableau du nombre de carte (nbCardsDeck) nécessaire au deck en sélectionnant les cardId aléatoirement parmi le nombre cartes de pokemonData
  for (let i = 0; i < nbCardsDeck; i++) {
    tabIdCards[i] = Math.floor(Math.random() * nbCardsPokemonData) + 1
  }
  return tabIdCards
}

async function main() {
  console.log('🌱 Starting database seed...')

  // Suppression des données déjà présente dans la database
  await prisma.deckCard?.deleteMany()
  await prisma.deck.deleteMany()
  await prisma.card.deleteMany()
  await prisma.user.deleteMany()

  // Création des user
  const hashedPassword = await bcrypt.hash('password123', 10)

  await prisma.user.createMany({
    data: [
      {
        username: 'red',
        email: 'red@example.com',
        password: hashedPassword,
      },
      {
        username: 'blue',
        email: 'blue@example.com',
        password: hashedPassword,
      },
    ],
  })

  const redUser = await prisma.user.findUnique({
    where: { email: 'red@example.com' },
  })
  const blueUser = await prisma.user.findUnique({
    where: { email: 'blue@example.com' },
  })

  if (!redUser || !blueUser) {
    throw new Error('Failed to create users')
  }

  console.log('✅ Created users:', redUser.username, blueUser.username)

  // Création de pokemonData
  const pokemonDataPath = join(__dirname, 'data', 'pokemon.json')
  const pokemonJson = readFileSync(pokemonDataPath, 'utf-8')
  const pokemonData: CardModel[] = JSON.parse(pokemonJson)

  const createdCards = await Promise.all(
    pokemonData.map((pokemon) =>
      prisma.card.create({
        data: {
          name: pokemon.name,
          hp: pokemon.hp,
          attack: pokemon.attack,
          type: PokemonType[pokemon.type as keyof typeof PokemonType],
          pokedexNumber: pokemon.pokedexNumber,
          imgUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.pokedexNumber}.png`,
        },
      }),
    ),
  )

  console.log(`✅ Created ${pokemonData.length} Pokemon cards`)

  // Création du deck pour le jouer red
  const cards_red: number[] = await getTabCards(10, pokemonData.length) // génération de son tableau de cardId

  await prisma.deck.create({
    data: {
      name: 'Starter Deck',
      userId: redUser.id,
      cards: {
        create: cards_red.map((id) => ({
          cardId: id,
        })),
      },
    },
  })

  console.log(`✅ Created Starter Deck for user red`)

  // Création du deck pour le jouer red
  const cards_blue: number[] = await getTabCards(10, pokemonData.length) // génération de son tableau de cardId

  await prisma.deck.create({
    data: {
      name: 'Starter Deck',
      userId: blueUser.id,
      cards: {
        create: cards_blue.map((id) => ({ cardId: id })),
      },
    },
  })

  console.log(`✅ Created Starter Deck for user blue`)

  console.log('\n🎉 Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
