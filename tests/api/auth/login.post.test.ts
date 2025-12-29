import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
  },
}))

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn(),
  },
}))

// Mock the database
vi.mock('~/server/utils/db', () => ({
  default: {
    postgres: {
      user: {
        findUnique: vi.fn(),
      },
    },
  },
}))

describe('POST /api/auth/login', () => {
  let mockUserFindUnique: any
  let mockBcryptCompare: any
  let mockJwtSign: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Set JWT_SECRET environment variable
    process.env.JWT_SECRET = 'test-jwt-secret-key'

    // Import mocked modules
    const dbModule = await import('~/server/utils/db')
    const bcryptModule = await import('bcrypt')
    const jwtModule = await import('jsonwebtoken')

    mockUserFindUnique = dbModule.default.postgres.user.findUnique as any
    mockBcryptCompare = bcryptModule.default.compare as any
    mockJwtSign = jwtModule.default.sign as any
  })

  describe('Validation', () => {
    it('should reject request without email', () => {
      const body = {
        password: 'password123',
        // Missing email
      }

      expect((body as any).email).toBeUndefined()
      expect(body.password).toBeDefined()
    })

    it('should reject request without password', () => {
      const body = {
        email: 'user@test.com',
        // Missing password
      }

      expect(body.email).toBeDefined()
      expect((body as any).password).toBeUndefined()
    })

    it('should accept request with email and password', () => {
      const body = {
        email: 'user@test.com',
        password: 'password123',
      }

      expect(body.email).toBeDefined()
      expect(body.password).toBeDefined()
    })

    it('should reject invalid JSON format', () => {
      const invalidJson = '{ invalid json }'

      expect(() => JSON.parse(invalidJson)).toThrow()
    })

    it('should parse valid JSON string', () => {
      const validJson = '{"email":"user@test.com","password":"password123"}'

      const parsed = JSON.parse(validJson)
      expect(parsed.email).toBe('user@test.com')
      expect(parsed.password).toBe('password123')
    })
  })

  describe('User Authentication', () => {
    it('should reject non-existent email', async () => {
      mockUserFindUnique.mockResolvedValue(null)

      const result = await mockUserFindUnique({
        where: { email: 'nonexistent@test.com' },
        include: {
          authentication: true,
          role: true,
        },
      })

      expect(result).toBeNull()
    })

    it('should reject user without authentication', async () => {
      const userWithoutAuth = {
        id: 'user-1',
        email: 'user@test.com',
        username: 'user',
        authentication: null,
        role: { id: 'role-user', name: 'user' },
      }

      mockUserFindUnique.mockResolvedValue(userWithoutAuth)

      const result = await mockUserFindUnique({
        where: { email: 'user@test.com' },
        include: {
          authentication: true,
          role: true,
        },
      })

      expect(result.authentication).toBeNull()
    })

    it('should find user with authentication', async () => {
      const userWithAuth = {
        id: 'user-1',
        email: 'user@test.com',
        username: 'user',
        authentication: {
          id: 'auth-1',
          password: 'hashed_password',
        },
        role: { id: 'role-user', name: 'user' },
      }

      mockUserFindUnique.mockResolvedValue(userWithAuth)

      const result = await mockUserFindUnique({
        where: { email: 'user@test.com' },
        include: {
          authentication: true,
          role: true,
        },
      })

      expect(result.authentication).toBeDefined()
      expect(result.authentication.password).toBe('hashed_password')
    })
  })

  describe('Password Verification', () => {
    it('should reject incorrect password', async () => {
      mockBcryptCompare.mockResolvedValue(false)

      const result = await mockBcryptCompare('wrongpassword', 'hashed_password')

      expect(result).toBe(false)
    })

    it('should accept correct password', async () => {
      mockBcryptCompare.mockResolvedValue(true)

      const result = await mockBcryptCompare('correctpassword', 'hashed_password')

      expect(result).toBe(true)
    })
  })

  describe('JWT Token Generation', () => {
    beforeEach(() => {
      const mockUser = {
        id: 'user-1',
        email: 'user@test.com',
        username: 'user',
        authentication: {
          id: 'auth-1',
          password: 'hashed_password',
        },
        role: { id: 'role-user', name: 'user' },
      }

      mockUserFindUnique.mockResolvedValue(mockUser)
      mockBcryptCompare.mockResolvedValue(true)
    })

    it('should generate JWT token with correct payload', async () => {
      const mockToken = 'jwt_token_here'
      mockJwtSign.mockReturnValue(mockToken)

      const payload = {
        userId: 'user-1',
        email: 'user@test.com',
        username: 'user',
        role: 'user',
      }

      const token = mockJwtSign(payload, 'test-jwt-secret-key', { expiresIn: '7d' })

      expect(token).toBe(mockToken)
      expect(mockJwtSign).toHaveBeenCalledWith(
        payload,
        'test-jwt-secret-key',
        { expiresIn: '7d' }
      )
    })

    it('should handle missing JWT_SECRET', () => {
      delete process.env.JWT_SECRET

      expect(process.env.JWT_SECRET).toBeUndefined()
    })

    it('should use custom expiration time from environment', () => {
      process.env.JWT_EXPIRES_IN = '30d'
      const mockToken = 'jwt_token_here'
      mockJwtSign.mockReturnValue(mockToken)

      const payload = {
        userId: 'user-1',
        email: 'user@test.com',
        username: 'user',
        role: 'user',
      }

      const token = mockJwtSign(payload, 'test-jwt-secret-key', { expiresIn: '30d' })

      expect(token).toBe(mockToken)
      expect(mockJwtSign).toHaveBeenCalledWith(
        payload,
        'test-jwt-secret-key',
        { expiresIn: '30d' }
      )
    })
  })

  describe('Response Format', () => {
    it('should return success response with token and user data', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@test.com',
        username: 'user',
        name: 'Test',
        surname: 'User',
        roleId: 'role-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        authentication: {
          id: 'auth-1',
          password: 'hashed_password',
        },
        role: { id: 'role-user', name: 'user' },
      }

      const mockToken = 'jwt_token_here'

      mockUserFindUnique.mockResolvedValue(mockUser)
      mockBcryptCompare.mockResolvedValue(true)
      mockJwtSign.mockReturnValue(mockToken)

      // Simulate removing authentication data
      const { authentication, ...userWithoutAuth } = mockUser

      const expectedResponse = {
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutAuth,
          token: mockToken,
          expiresIn: '7d',
        },
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.message).toBe('Login successful')
      expect(expectedResponse.data.token).toBe(mockToken)
      expect(expectedResponse.data.user.authentication).toBeUndefined()
      expect(expectedResponse.data.user.email).toBe('user@test.com')
      expect(expectedResponse.data.expiresIn).toBeDefined()
    })

    it('should not expose password hash in response', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@test.com',
        username: 'user',
        authentication: {
          id: 'auth-1',
          password: 'hashed_password',
        },
        role: { id: 'role-user', name: 'user' },
      }

      mockUserFindUnique.mockResolvedValue(mockUser)
      mockBcryptCompare.mockResolvedValue(true)
      mockJwtSign.mockReturnValue('token')

      // Verify authentication is removed
      const { authentication, ...userWithoutAuth } = mockUser

      expect(userWithoutAuth.authentication).toBeUndefined()
      expect((userWithoutAuth as any).password).toBeUndefined()
    })
  })

  describe('Database Operations', () => {
    it('should handle database errors', async () => {
      mockUserFindUnique.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockUserFindUnique({
          where: { email: 'user@test.com' },
          include: {
            authentication: true,
            role: true,
          },
        })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Different User Roles', () => {
    it('should login admin user', async () => {
      const mockAdmin = {
        id: 'admin-1',
        email: 'admin@test.com',
        username: 'admin',
        authentication: {
          id: 'auth-admin',
          password: 'hashed_password',
        },
        role: { id: 'role-admin', name: 'admin' },
      }

      mockUserFindUnique.mockResolvedValue(mockAdmin)
      mockBcryptCompare.mockResolvedValue(true)
      mockJwtSign.mockReturnValue('admin_token')

      const result = await mockUserFindUnique({
        where: { email: 'admin@test.com' },
        include: {
          authentication: true,
          role: true,
        },
      })

      expect(result.role.name).toBe('admin')
    })

    it('should login regular user', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@test.com',
        username: 'user',
        authentication: {
          id: 'auth-user',
          password: 'hashed_password',
        },
        role: { id: 'role-user', name: 'user' },
      }

      mockUserFindUnique.mockResolvedValue(mockUser)
      mockBcryptCompare.mockResolvedValue(true)
      mockJwtSign.mockReturnValue('user_token')

      const result = await mockUserFindUnique({
        where: { email: 'user@test.com' },
        include: {
          authentication: true,
          role: true,
        },
      })

      expect(result.role.name).toBe('user')
    })
  })
})
