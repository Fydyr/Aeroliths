// Centralized export for both databases
import prisma from './prisma'
import arangodb from './arangodb'

export const db = {
  // PostgreSQL via Prisma (relational data)
  postgres: prisma,

  // ArangoDB (multi-model graph database)
  graph: arangodb,
}

export default db
