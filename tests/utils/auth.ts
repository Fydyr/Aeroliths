import jwt from 'jsonwebtoken'

export interface TestUser {
  userId: string
  email: string
  username: string
  role: string
}

/**
 * Generate a test JWT token for a user
 */
export function generateTestToken(user: TestUser): string {
  const jwtSecret = process.env.JWT_SECRET || 'test-jwt-secret-key'
  return jwt.sign(user, jwtSecret, { expiresIn: '7d' })
}

/**
 * Create a test admin user
 */
export function createTestAdmin(): TestUser {
  return {
    userId: 'test-admin-id',
    email: 'admin@test.com',
    username: 'admin',
    role: 'admin',
  }
}

/**
 * Create a test regular user
 */
export function createTestUser(): TestUser {
  return {
    userId: 'test-user-id',
    email: 'user@test.com',
    username: 'user',
    role: 'user',
  }
}
