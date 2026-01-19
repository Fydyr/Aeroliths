# Aeroliths

A web-based remake of the Skystones minigame from Skylanders. Place stones on the board, capture your opponent's pieces, and dominate the field.

## Game Features

- **Strategic gameplay**: Each stone has 4 directional values (up, down, left, right). Place a stone adjacent to your opponent's and if your value is higher, you capture it. Variable board size
- **Element system**: Stones belong to different elements with strengths and weaknesses, adding tactical depth
- **Collection system**: Build your stone collection with various rarities
- **Multiple game modes** (planned): Local multiplayer, bot opponents, online matchmaking, and story mode
- **Leaderboard**: Compete for the top rankings

## Tech Stack

- [Nuxt 4](https://nuxt.com/) / [Vue 3](https://vuejs.org/)
- [PostgreSQL](https://www.postgresql.org/) ([Prisma ORM](https://www.prisma.io/))
- [ArangoDB](https://arangodb.com/) (graph database)
- [JWT](https://jwt.io/) authentication

## Prerequisites

- Node.js 20+
- PostgreSQL
- ArangoDB

## Installation

```bash
npm install
```

## Configuration

```bash
cp .env.example .env
```

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection URL |
| `ARANGO_URL` | ArangoDB server URL |
| `ARANGO_DB` | ArangoDB database name |
| `ARANGO_USER` | ArangoDB username |
| `ARANGO_PASSWORD` | ArangoDB password |
| `JWT_SECRET` | JWT secret key |
| `DISCORD_WEBHOOK_URL` | Discord webhook (notifications) |

## Development

```bash
npm run dev
```

### Prisma

```bash
npm run prisma:generate      # Generate client
npm run prisma:migrate       # Run migrations (dev)
npm run prisma:migrate:prod  # Run migrations (prod)
npm run prisma:studio        # GUI
npm run prisma:seed          # Seed database
```

### Tests

```bash
npm run test           # Watch mode
npm run test:run       # Run once
npm run test:coverage  # With coverage
npm run test:ui        # Vitest UI
```

## Production

```bash
npm run build
node .output/server/index.mjs
```

### Docker

```bash
docker-compose up -d --build
```

The application connects to external PostgreSQL and ArangoDB servers.
