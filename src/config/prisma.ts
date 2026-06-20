import { PrismaClient } from '@prisma/client'

// 1. On crée un type pour éviter les alertes TypeScript sur l'objet global
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 2. On réutilise l'instance existante, ou on en crée une si elle n'existe pas
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

// 3. En mode développement, on sauvegarde l'instance dans l'objet global
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
