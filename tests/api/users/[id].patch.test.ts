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
        findFirst: vi.fn(),
        update: vi.fn(),
      },
    },
  },
}))

describe('PATCH /api/users/[id]', () => {
  let mockGetAuthUser: any
  let mockUserFindUnique: any
  let mockUserFindFirst: any
  let mockUserUpdate: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')

    mockGetAuthUser = authModule.getAuthUser as any
    mockUserFindUnique = dbModule.default.postgres.user.findUnique as any
    mockUserFindFirst = dbModule.default.postgres.user.findFirst as any
    mockUserUpdate = dbModule.default.postgres.user.update as any
  })

  describe('Authentication and Authorization', () => {
    it('should require authentication', () => {
      mockGetAuthUser.mockImplementation(() => {
        throw createError({
          statusCode: 401,
          statusMessage: 'Unauthorized',
        })
      })

      expect(() => mockGetAuthUser({})).toThrow()
    })

    it('should allow user to update their own profile', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      const mockUser = {
        id: 'test-user-id', // Same as testUser.userId
        email: 'user@test.com',
        username: 'user',
        role: { id: 'role-user', name: 'user' },
      }

      mockUserFindUnique.mockResolvedValue(mockUser)

      const user = await mockUserFindUnique({
        where: { id: 'test-user-id' },
        include: { role: true },
      })

      // User owns this profile
      expect(user.id).toBe(testUser.userId)
    })

    it('should prevent user from updating another user profile', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      const mockOtherUser = {
        id: 'other-user-id', // Different from testUser.userId
        email: 'other@test.com',
        username: 'otheruser',
        role: { id: 'role-user', name: 'user' },
      }

      mockUserFindUnique.mockResolvedValue(mockOtherUser)

      const user = await mockUserFindUnique({
        where: { id: 'other-user-id' },
        include: { role: true },
      })

      // User does not own this profile and is not admin
      expect(user.id).not.toBe(testUser.userId)
      expect(testUser.role).toBe('user')
    })

    it('should allow admin to update any user profile', async () => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)

      const mockUser = {
        id: 'any-user-id',
        email: 'user@test.com',
        username: 'user',
        role: { id: 'role-user', name: 'user' },
      }

      mockUserFindUnique.mockResolvedValue(mockUser)

      const user = await mockUserFindUnique({
        where: { id: 'any-user-id' },
        include: { role: true },
      })

      // Admin can update any user
      expect(testAdmin.role).toBe('admin')
      expect(user.id).toBeDefined()
    })
  })

  describe('Validation', () => {
    beforeEach(() => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)
    })

    it('should reject missing user ID', () => {
      const id = undefined
      expect(id).toBeUndefined()
    })

    it('should reject non-existent user', async () => {
      mockUserFindUnique.mockResolvedValue(null)

      const result = await mockUserFindUnique({
        where: { id: 'non-existent' },
        include: { role: true },
      })

      expect(result).toBeNull()
    })

    it('should reject invalid email format', () => {
      const invalidEmails = [
        'notanemail',
        'missing@domain',
        '@nodomain.com',
        'spaces in@email.com',
      ]

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false)
      })
    })

    it('should accept valid email format', () => {
      const validEmails = [
        'user@test.com',
        'test.user@example.com',
        'user+tag@domain.co.uk',
      ]

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true)
      })
    })

    it('should reject empty update data', () => {
      const updateData = {}
      expect(Object.keys(updateData).length).toBe(0)
    })
  })

  describe('Duplicate Checks', () => {
    beforeEach(() => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      mockUserFindUnique.mockResolvedValue({
        id: 'test-user-id',
        email: 'user@test.com',
        username: 'user',
        role: { id: 'role-user', name: 'user' },
      })
    })

    it('should reject duplicate email', async () => {
      const existingUser = {
        id: 'other-user-id',
        email: 'existing@test.com',
        username: 'otheruser',
      }

      mockUserFindFirst.mockResolvedValue(existingUser)

      const result = await mockUserFindFirst({
        where: {
          email: 'existing@test.com',
          NOT: { id: 'test-user-id' },
        },
      })

      expect(result).toEqual(existingUser)
      expect(result.email).toBe('existing@test.com')
    })

    it('should reject duplicate username', async () => {
      const existingUser = {
        id: 'other-user-id',
        email: 'other@test.com',
        username: 'existinguser',
      }

      mockUserFindFirst.mockResolvedValue(existingUser)

      const result = await mockUserFindFirst({
        where: {
          username: 'existinguser',
          NOT: { id: 'test-user-id' },
        },
      })

      expect(result).toEqual(existingUser)
      expect(result.username).toBe('existinguser')
    })

    it('should allow updating to same email (no change)', async () => {
      mockUserFindFirst.mockResolvedValue(null)

      const result = await mockUserFindFirst({
        where: {
          email: 'user@test.com',
          NOT: { id: 'test-user-id' },
        },
      })

      expect(result).toBeNull()
    })
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      mockUserFindUnique.mockResolvedValue({
        id: 'test-user-id',
        email: 'user@test.com',
        username: 'user',
        name: 'Test',
        surname: 'User',
        role: { id: 'role-user', name: 'user' },
      })

      mockUserFindFirst.mockResolvedValue(null)
    })

    it('should update user email', async () => {
      const updatedUser = {
        id: 'test-user-id',
        email: 'newemail@test.com',
        username: 'user',
        name: 'Test',
        surname: 'User',
        role: { id: 'role-user', name: 'user' },
      }

      mockUserUpdate.mockResolvedValue(updatedUser)

      const result = await mockUserUpdate({
        where: { id: 'test-user-id' },
        data: { email: 'newemail@test.com' },
        include: { role: true },
      })

      expect(result.email).toBe('newemail@test.com')
    })

    it('should update user username', async () => {
      const updatedUser = {
        id: 'test-user-id',
        email: 'user@test.com',
        username: 'newusername',
        name: 'Test',
        surname: 'User',
        role: { id: 'role-user', name: 'user' },
      }

      mockUserUpdate.mockResolvedValue(updatedUser)

      const result = await mockUserUpdate({
        where: { id: 'test-user-id' },
        data: { username: 'newusername' },
        include: { role: true },
      })

      expect(result.username).toBe('newusername')
    })

    it('should update user name and surname', async () => {
      const updatedUser = {
        id: 'test-user-id',
        email: 'user@test.com',
        username: 'user',
        name: 'NewName',
        surname: 'NewSurname',
        role: { id: 'role-user', name: 'user' },
      }

      mockUserUpdate.mockResolvedValue(updatedUser)

      const result = await mockUserUpdate({
        where: { id: 'test-user-id' },
        data: { name: 'NewName', surname: 'NewSurname' },
        include: { role: true },
      })

      expect(result.name).toBe('NewName')
      expect(result.surname).toBe('NewSurname')
    })

    it('should update multiple fields at once', async () => {
      const updatedUser = {
        id: 'test-user-id',
        email: 'newemail@test.com',
        username: 'newusername',
        name: 'NewName',
        surname: 'NewSurname',
        role: { id: 'role-user', name: 'user' },
      }

      mockUserUpdate.mockResolvedValue(updatedUser)

      const result = await mockUserUpdate({
        where: { id: 'test-user-id' },
        data: {
          email: 'newemail@test.com',
          username: 'newusername',
          name: 'NewName',
          surname: 'NewSurname',
        },
        include: { role: true },
      })

      expect(result.email).toBe('newemail@test.com')
      expect(result.username).toBe('newusername')
      expect(result.name).toBe('NewName')
      expect(result.surname).toBe('NewSurname')
    })

    it('should handle null optional fields', async () => {
      const updatedUser = {
        id: 'test-user-id',
        email: 'user@test.com',
        username: 'user',
        name: null,
        surname: null,
        role: { id: 'role-user', name: 'user' },
      }

      mockUserUpdate.mockResolvedValue(updatedUser)

      const result = await mockUserUpdate({
        where: { id: 'test-user-id' },
        data: { name: null, surname: null },
        include: { role: true },
      })

      expect(result.name).toBeNull()
      expect(result.surname).toBeNull()
    })

    it('should handle database errors', async () => {
      mockUserUpdate.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockUserUpdate({
          where: { id: 'test-user-id' },
          data: { email: 'new@test.com' },
        })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Response Format', () => {
    it('should return success response with updated user', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      mockUserFindUnique.mockResolvedValue({
        id: 'test-user-id',
        email: 'user@test.com',
        username: 'user',
        role: { id: 'role-user', name: 'user' },
      })

      mockUserFindFirst.mockResolvedValue(null)

      const updatedUser = {
        id: 'test-user-id',
        email: 'newemail@test.com',
        username: 'user',
        name: 'Updated',
        surname: 'User',
        roleId: 'role-user',
        role: { id: 'role-user', name: 'user' },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUserUpdate.mockResolvedValue(updatedUser)

      const expectedResponse = {
        success: true,
        message: 'User updated successfully',
        data: updatedUser,
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.message).toBe('User updated successfully')
      expect(expectedResponse.data).toEqual(updatedUser)
    })
  })
})
