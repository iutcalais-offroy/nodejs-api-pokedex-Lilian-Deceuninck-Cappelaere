import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { authRepository } from './auth.repository'

export const authService = {
    async signUp(email: string, username: string, password: string) {
        const mail = await authRepository.findUserByEmail(email)

        if (mail) {
            throw new Error('EMAIL_ALREADY_USED')
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const user = await authRepository.createUser(username, email, hashedPassword)

        // Générer le JWT
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }, // Le token expire dans 7 jours
        )

        return { user, token }
    },

    async signIn(email: string, password: string) {
        // Vérifier que l'utilisateur existe
        const user = await authRepository.findUserByEmail(email)

        if (!user) {
            throw new Error('INVALID_CREDENTIALS')
        }

        // Vérifier le mot de passe
        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            throw new Error('INVALID_CREDENTIALS')
        }

        // Générer le JWT
        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
            },
            process.env.JWT_SECRET as string,
            { expiresIn: '7d' }, // Le token expire dans 7 jours
        )

        return {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
            },
            token
        }
    }
}