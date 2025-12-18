import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import { config } from 'dotenv'
import dotenvExpand from 'dotenv-expand'

const myEnv = config()
dotenvExpand.expand(myEnv)

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not defined in .env file')
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
    adapter,
    log: ['query', 'info', 'warn', 'error'],
})

async function main() {
    // Create some roles

    const userRole = await prisma.role.upsert({
        where: { name: 'user' },
        update: {},
        create: {
            name: 'user',
        },
    })

    const adminRole = await prisma.role.upsert({
        where: { name: 'admin' },
        update: {},
        create: {
            name: 'admin',
        },
    })

}

main().catch((e) => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});