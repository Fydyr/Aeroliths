import * as dotenv from 'dotenv'
import * as dotenvExpand from 'dotenv-expand'
import { defineConfig, env } from 'prisma/config'

// Load .env with variable expansion support
const myEnv = dotenv.config()
dotenvExpand.expand(myEnv)

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
})
