import { Request, Response, Router } from 'express'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import prisma from "../database";

export const authRouter = Router()

// POST /api/auth/sign-up
// Accessible via POST /api/auth/sign-up
authRouter.post('/sign-up', async (req: Request, res: Response) => {
    const { email, username, password } = req.body
    try {
        // 1. Vérifier que les données sont complètes
        if (!email || !username || !password){
            return res.status(400).json({ error: 'Les données sont incomplètes' })
        }

        // 2. Vérifier si l'utilisateur existe déjà
        const mail = await prisma.user.findUnique({
            where: { email },
        })

        if (mail) {
            return res.status(409).json({ error: 'Email déjà utilisé' })
        }
        
        const hashedPassword = await bcrypt.hash(password, 10)

        // 3. Création de l'user
        const user = await prisma.user.create({
            data: { username, email, password: hashedPassword },
            select: {
                id: true,
                username: true,
                email: true,
            },
        })

        // 4. Générer le JWT
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }, // Le token expire dans 7 jours
        )

        // 5. Retourner le token
        return res.status(201).json({
            message: "Création de l'utilisateur réussie",
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        })

    } catch (error) {
        console.error('Erreur lors de la connexion:', error)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})

// POST api/auth/sign-in
// Accessible via POST api/auth/sign-in
authRouter.post('/sign-in', async (req: Request, res: Response) => {
    const { email, password } = req.body

    try {
        // 1. Vérifier que les données sont complètes
        if (!email || !password) {
            return res.status(400).json({ error: 'Les données sont incomplètes' })
        }

        // 2. Vérifier que l'utilisateur existe
        const user = await prisma.user.findUnique({
            where: { email },
        })

        if (!user) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
        }

        // 3. Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Email ou mot de passe incorrect' })
        }

        // 4. Générer le JWT
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }, // Le token expire dans 7 jours
        )

        // 5. Retourner le token
        return res.status(200).json({
            message: 'Connexion réussie',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
        })
    } catch (error) {
        console.error('Erreur lors de la connexion:', error)
        return res.status(500).json({ error: 'Erreur serveur' })
    }
})