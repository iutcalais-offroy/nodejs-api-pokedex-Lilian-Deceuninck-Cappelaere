import prisma from "../database";

export const authRepository = {
    async findUserByEmail(email: string) {
        // Vérifier si l'utilisateur existe déjà
        return await prisma.user.findUnique({
            where: { email },
        })
    },

    async createUser(username: string, email: string, hashedPassword: string) {
        // Création de l'user
        return await prisma.user.create({
            data: { username, email, password: hashedPassword },
            select: {
                id: true,
                username: true,
                email: true,
            },
        })
    }
}