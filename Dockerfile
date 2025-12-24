FROM node:20-alpine

# Installer les outils nécessaires
RUN apk add --no-cache git openssh-client bash

WORKDIR /app

# Copier les fichiers de dépendances
COPY package*.json ./
COPY prisma ./prisma/

# Installer TOUTES les dépendances (dev incluses pour le build)
RUN npm install --no-package-lock

# Copier le reste du code
COPY . .

# Générer le client Prisma (DATABASE_URL temporaire nécessaire pour la génération)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
RUN npm run prisma:generate

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