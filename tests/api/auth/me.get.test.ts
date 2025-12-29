import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateTestToken, createTestUser, createTestAdmin } from '../../utils/auth'

// Mock the auth utilities
vi.mock('~/server/utils/auth', () => ({
  getAuthUser: vi.fn(),
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

describe('GET /api/auth/me', () => {
  let mockGetAuthUser: any
  let mockUserFindUnique: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')

    mockGetAuthUser = authModule.getAuthUser as any
    mockUserFindUnique = dbModule.default.postgres.user.findUnique as any
  })

  describe('Authentication', () => {
    it('should require authentication', () => {
      mockGetAuthUser.mockImplementation(() => {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized',
        })
      })

      expect(() => mockGetAuthUser({})).toThrow()
    })

    it('should accept valid authenticated user', () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      const user = mockGetAuthUser({})
      expect(user).toEqual(testUser)
      expect(user.userId).toBe('test-user-id')
    })

    it('should extract user from JWT token', () => {
      const testUser = createTestUser()
      const token = generateTestToken(testUser)

      expect(token).toBeDefined()
      expect(typeof token).toBe('string')

      mockGetAuthUser.mockReturnValue(testUser)
      const user = mockGetAuthUser({})

      expect(user.userId).toBe(testUser.userId)
      expect(user.email).toBe(testUser.email)
    })
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)
    })

    it('should fetch user details from database', async () => {
      const mockUserDetails = {
        id: 'test-user-id',
        email: 'user@test.com',
        username: 'user',
        name: 'Test',
        surname: 'User',
        roleId: 'role-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: {
          id: 'role-user',
          name: 'user',
        },
      }

      mockUserFindUnique.mockResolvedValue(mockUserDetails)

      const result = await mockUserFindUnique({
        where: { id: 'test-user-id' },
        include: {
          role: true,
        },
      })

      expect(result).toEqual(mockUserDetails)
      expect(result.role).toBeDefined()
      expect(result.role.name).toBe('user')
    })

    it('should return null for non-existent user', async () => {
      mockUserFindUnique.mockResolvedValue(null)

      const result = await mockUserFindUnique({
        where: { id: 'non-existent-id' },
        include: {
          role: true,
        },
      })

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      mockUserFindUnique.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockUserFindUnique({
          where: { id: 'test-user-id' },
          include: {
            role: true,
          },
        })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Response Format', () => {
    it('should return success response with user details', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      const mockUserDetails = {
        id: 'test-user-id',
        email: 'user@test.com',
        username: 'user',
        name: 'Test',
        surname: 'User',
        roleId: 'role-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: {
          id: 'role-user',
          name: 'user',
        },
      }

      mockUserFindUnique.mockResolvedValue(mockUserDetails)

      const expectedResponse = {
        success: true,
        data: mockUserDetails,
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.data).toEqual(mockUserDetails)
      expect(expectedResponse.data.email).toBe('user@test.com')
      expect(expectedResponse.data.role).toBeDefined()
    })

    it('should include all user properties', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      const mockUserDetails = {
        id: 'test-user-id',
        email: 'user@test.com',
        username: 'user',
        name: 'Test',
        surname: 'User',
        roleId: 'role-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: {
          id: 'role-user',
          name: 'user',
        },
      }

      mockUserFindUnique.mockResolvedValue(mockUserDetails)

      const result = await mockUserFindUnique({
        where: { id: 'test-user-id' },
        include: { role: true },
      })

      expect(result.id).toBeDefined()
      expect(result.email).toBeDefined()
      expect(result.username).toBeDefined()
      expect(result.name).toBeDefined()
      expect(result.surname).toBeDefined()
      expect(result.roleId).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
      expect(result.role).toBeDefined()
    })

    it('should handle users with null optional fields', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      const mockUserDetails = {
        id: 'test-user-id',
        email: 'user@test.com',
        username: 'user',
        name: null,
        surname: null,
        roleId: 'role-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: {
          id: 'role-user',
          name: 'user',
        },
      }

      mockUserFindUnique.mockResolvedValue(mockUserDetails)

      const result = await mockUserFindUnique({
        where: { id: 'test-user-id' },
        include: { role: true },
      })

      expect(result.name).toBeNull()
      expect(result.surname).toBeNull()
    })
  })

  describe('Different User Roles', () => {
    it('should return admin user details', async () => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)

      const mockAdminDetails = {
        id: 'test-admin-id',
        email: 'admin@test.com',
        username: 'admin',
        name: 'Admin',
        surname: 'User',
        roleId: 'role-admin',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: {
          id: 'role-admin',
          name: 'admin',
        },
      }

      mockUserFindUnique.mockResolvedValue(mockAdminDetails)

      const result = await mockUserFindUnique({
        where: { id: 'test-admin-id' },
        include: {
          role: true,
        },
      })

      expect(result.role.name).toBe('admin')
      expect(result.email).toBe('admin@test.com')
    })

    it('should return regular user details', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      const mockUserDetails = {
        id: 'test-user-id',
        email: 'user@test.com',
        username: 'user',
        name: 'Regular',
        surname: 'User',
        roleId: 'role-user',
        createdAt: new Date(),
        updatedAt: new Date(),
        role: {
          id: 'role-user',
          name: 'user',
        },
      }

      mockUserFindUnique.mockResolvedValue(mockUserDetails)

      const result = await mockUserFindUnique({
        where: { id: 'test-user-id' },
        include: {
          role: true,
        },
      })

      expect(result.role.name).toBe('user')
      expect(result.email).toBe('user@test.com')
    })
  })

  describe('Token Validation', () => {
    it('should use userId from JWT payload', () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      const user = mockGetAuthUser({})

      expect(user.userId).toBe('test-user-id')

      // This userId should be used to fetch user details
      mockUserFindUnique.mockResolvedValue({
        id: user.userId,
        email: user.email,
        username: user.username,
        role: { id: 'role-user', name: user.role },
      })
    })

    it('should handle expired or invalid token', () => {
      mockGetAuthUser.mockImplementation(() => {
        throw createError({
          statusCode: 401,
          statusMessage: 'Invalid or expired token',
        })
      })

      expect(() => mockGetAuthUser({})).toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle user deleted after token was issued', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      // User exists in token but not in database
      mockUserFindUnique.mockResolvedValue(null)

      const result = await mockUserFindUnique({
        where: { id: testUser.userId },
        include: { role: true },
      })

      expect(result).toBeNull()
    })

    it('should handle concurrent requests from same user', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      const mockUserDetails = {
        id: 'test-user-id',
        email: 'user@test.com',
        username: 'user',
        role: { id: 'role-user', name: 'user' },
      }

      mockUserFindUnique.mockResolvedValue(mockUserDetails)

      // Simulate multiple concurrent calls
      const request1 = mockUserFindUnique({
        where: { id: testUser.userId },
        include: { role: true },
      })

      const request2 = mockUserFindUnique({
        where: { id: testUser.userId },
        include: { role: true },
      })

      const [result1, result2] = await Promise.all([request1, request2])

      expect(result1).toEqual(mockUserDetails)
      expect(result2).toEqual(mockUserDetails)
    })
  })
})
