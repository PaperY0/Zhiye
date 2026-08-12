import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { toSessionUser } from "./dbUser.ts"

const globalForPrisma = globalThis as unknown as { zhiyePrisma?: PrismaClient }

function getPrisma() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) throw new Error("DATABASE_URL is required for the web database client")
  const prisma = globalForPrisma.zhiyePrisma ?? new PrismaClient({ adapter: new PrismaPg({ connectionString }) })
  if (process.env.NODE_ENV !== "production") globalForPrisma.zhiyePrisma = prisma
  return prisma
}

export async function findUserByEmail(email: string) {
  const user = await getPrisma().user.findUnique({ where: { email } })
  return user ? toSessionUser(user) : null
}
