# Système d'Authentification Aeroliths

Ce document décrit le système d'authentification mis en place pour l'application Aeroliths.

## Architecture

Le système utilise JWT (JSON Web Tokens) pour l'authentification stateless avec les composants suivants :

### 1. Composable useAuth ([app/composables/useAuth.ts](app/composables/useAuth.ts))

Gère l'état d'authentification global de l'application :

- `user` - Informations de l'utilisateur connecté
- `token` - Token JWT
- `isAuthenticated` - État de connexion
- `isLoading` - État de chargement
- `initAuth()` - Initialise l'authentification depuis localStorage
- `login(credentials)` - Connexion utilisateur
- `register(data)` - Inscription utilisateur
- `logout()` - Déconnexion
- `hasRole(roleName)` - Vérification des rôles

### 2. Pages d'authentification

- **[/login](app/pages/login.vue)** - Page de connexion
- **[/register](app/pages/register.vue)** - Page d'inscription

### 3. Middleware ([app/middleware/auth.ts](app/middleware/auth.ts))

Protège les routes qui nécessitent une authentification. À appliquer avec :

```typescript
definePageMeta({
  middleware: 'auth'
})
```

### 4. Pages protégées

Les pages suivantes nécessitent une authentification :

- **[/play](app/pages/play.vue)** - Interface de jeu
- **[/rules](app/pages/rules.vue)** - Règles du jeu
- **[/leaderboard](app/pages/leaderboard.vue)** - Classement

### 5. Header dynamique ([app/components/HeaderComponent.vue](app/components/HeaderComponent.vue))

Le header affiche différents liens selon l'état d'authentification :

**Non connecté :**
- Home
- Login
- Register

**Connecté :**
- Home
- Play
- Rules
- Leaderboard
- Nom d'utilisateur + bouton Logout

## API Endpoints

### POST `/api/auth/login`

Connexion avec email et mot de passe.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "username": "...",
    "role": { "name": "user" }
  },
  "token": "jwt_token_here"
}
```

### GET `/api/auth/me`

Récupère les informations de l'utilisateur connecté.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "user": {
    "id": "...",
    "email": "...",
    "username": "...",
    "name": "...",
    "surname": "...",
    "role": { "name": "user" }
  }
}
```

### POST `/api/users`

Création d'un nouveau compte utilisateur.

**Body:**
```json
{
  "email": "user@example.com",
  "username": "username",
  "password": "password123",
  "name": "John",
  "surname": "Doe"
}
```

## Variables d'environnement

Configurées dans [.env](.env) :

```env
JWT_SECRET=votre_secret_jwt
JWT_EXPIRES_IN=7d
DATABASE_URL=postgresql://...
```

## Stockage

- **Token JWT** : Stocké dans `localStorage` sous la clé `auth_token`
- **Expiration** : 7 jours par défaut (configurable)

## Sécurité

- Mots de passe hashés avec bcrypt (10 salt rounds)
- Token JWT signé avec secret
- Middleware de protection des routes
- Vérification des rôles côté serveur
- Validation des données d'entrée

## Utilisation

### Dans un composant

```vue
<script setup lang="ts">
import { useAuth } from '~/composables/useAuth'

const { user, isAuthenticated, logout } = useAuth()

// Utiliser user.value et isAuthenticated.value
</script>
```

### Protéger une route

```vue
<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})
</script>
```

### Appel API authentifié

```typescript
const { token } = useAuth()

const data = await $fetch('/api/protected-endpoint', {
  headers: {
    Authorization: `Bearer ${token.value}`
  }
})
```

## Tests

Pour tester l'authentification :

1. Démarrez le serveur : `npm run dev`
2. Créez un compte sur `/register`
3. Connectez-vous sur `/login`
4. Vous serez redirigé vers `/play`
5. Les liens protégés apparaissent dans le header
6. Testez la déconnexion avec le bouton "Logout"

## Base de données

Le schéma Prisma inclut :

- **User** - Informations utilisateur
- **Authentication** - Mots de passe hashés
- **Role** - Rôles utilisateur (user, admin)

Voir [prisma/schema.prisma](prisma/schema.prisma) pour plus de détails.
