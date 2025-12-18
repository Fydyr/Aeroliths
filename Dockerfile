FROM node:20-alpine

# Installer les outils nécessaires
RUN apk add --no-cache git openssh-client bash

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer les dépendances
RUN npm ci --only=production

# Copier le reste du code
COPY . .

# Générer le client Prisma
RUN npm run prisma:generate

# Exécuter les migrations Prisma en production
RUN npm run prisma:migrate:prod

# Seed de la base de données
RUN npm run prisma:seed

# Build de l'application Nuxt
RUN npm run build

# Exposer le port
EXPOSE 3000

# Variable d'environnement pour la production
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Lancer l'application Nuxt en mode production
CMD ["node", ".output/server/index.mjs"]