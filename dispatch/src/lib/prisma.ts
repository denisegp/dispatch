import { PrismaClient } from '@/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaPg } from '@prisma/adapter-pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createClient() {
  const url = process.env.DATABASE_URL!
  // Use the Neon serverless adapter for Neon connections (production),
  // standard pg adapter for local Postgres (development).
  const isNeon = url.includes('neon.tech')
  const adapter = isNeon
    ? new PrismaNeon({ connectionString: url })
    : new PrismaPg({ connectionString: url })

  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
