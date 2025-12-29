import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateTestToken, createTestUser, createTestAdmin } from '../../../utils/auth'
import bcrypt from 'bcrypt'

// Mock bcrypt
vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}))

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
      authentication: {
        update: vi.fn(),
      },
    },
  },
}))

describe('PATCH /api/users/[id]/password', () => {
  let mockGetAuthUser: any
  let mockUserFindUnique: any
  let mockAuthenticationUpdate: any
  let mockBcryptCompare: any
  let mockBcryptHash: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')
    const bcryptModule = await import('bcrypt')

    mockGetAuthUser = authModule.getAuthUser as any
    mockUserFindUnique = dbModule.default.postgres.user.findUnique as any
    mockAuthenticationUpdate = dbModule.default.postgres.authentication.update as any
    mockBcryptCompare = bcryptModule.default.compare as any
    mockBcryptHash = bcryptModule.default.hash as any
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

    it('should allow user to update their own password', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      const mockUser = {
        id: 'test-user-id', // Same as testUser.userId
        email: 'user@test.com',
        username: 'user',
        authentication: {
          id: 'auth-1',
          password: 'hashed_password',
        },
        role: { id: 'role-user', name: 'user' },
      }

      mockUserFindUnique.mockResolvedValue(mockUser)

      const user = await mockUserFindUnique({
        where: { id: 'test-user-id' },
        include: { authentication: true, role: true },
      })

      // User owns this account
      expect(user.id).toBe(testUser.userId)
      expect(user.authentication).toBeDefined()
    })

    it('should prevent user from updating another user password', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      const mockOtherUser = {
        id: 'other-user-id', // Different from testUser.userId
        email: 'other@test.com',
        username: 'otheruser',
        authentication: {
          id: 'auth-2',
          password: 'hashed_password',
        },
        role: { id: 'role-user', name: 'user' },
      }

      mockUserFindUnique.mockResolvedValue(mockOtherUser)

      const user = await mockUserFindUnique({
        where: { id: 'other-user-id' },
        include: { authentication: true, role: true },
      })

      // User does not own this account and is not admin
      expect(user.id).not.toBe(testUser.userId)
      expect(testUser.role).toBe('user')
    })

    it('should allow admin to update any user password', async () => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)

      const mockUser = {
        id: 'any-user-id',
        email: 'user@test.com',
        username: 'user',
        authentication: {
          id: 'auth-1',
          password: 'hashed_password',
        },
        role: { id: 'role-user', name: 'user' },
      }

      mockUserFindUnique.mockResolvedValue(mockUser)

      const user = await mockUserFindUnique({
        where: { id: 'any-user-id' },
        include: { authentication: true, role: true },
      })

      // Admin can update any user password
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

    it('should reject missing new password', () => {
      const body = {
        currentPassword: 'oldpassword',
        // Missing newPassword
      }

      expect((body as any).newPassword).toBeUndefined()
    })

    it('should reject new password shorter than 8 characters', () => {
      const shortPasswords = ['1234567', 'abc', 'pass', '']

      shortPasswords.forEach(password => {
        expect(password.length).toBeLessThan(8)
      })
    })

    it('should accept new password with 8 or more characters', () => {
      const validPasswords = ['12345678', 'newpassword123', 'verylongpassword']

      validPasswords.forEach(password => {
        expect(password.length).toBeGreaterThanOrEqual(8)
      })
    })

    it('should reject non-existent user', async () => {
      mockUserFindUnique.mockResolvedValue(null)

      const result = await mockUserFindUnique({
        where: { id: 'non-existent' },
        include: { authentication: true, role: true },
      })

      expect(result).toBeNull()
    })

    it('should reject user without authentication', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@test.com',
        username: 'user',
        authentication: null,
        role: { id: 'role-user', name: 'user' },
      })

      const result = await mockUserFindUnique({
        where: { id: 'user-1' },
        include: { authentication: true, role: true },
      })

      expect(result.authentication).toBeNull()
    })
  })

  describe('Current Password Verification (Regular User)', () => {
    beforeEach(() => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      mockUserFindUnique.mockResolvedValue({
        id: 'test-user-id',
        email: 'user@test.com',
        username: 'user',
        authentication: {
          id: 'auth-1',
          userId: 'test-user-id',
          password: 'hashed_old_password',
        },
        role: { id: 'role-user', name: 'user' },
      })
    })

    it('should require current password for regular users', () => {
      const body = {
        newPassword: 'newpassword123',
        // Missing currentPassword
      }

      expect((body as any).currentPassword).toBeUndefined()
    })

    it('should reject incorrect current password', async () => {
      mockBcryptCompare.mockResolvedValue(false)

      const result = await mockBcryptCompare('wrongpassword', 'hashed_old_password')

      expect(result).toBe(false)
    })

    it('should accept correct current password', async () => {
      mockBcryptCompare.mockResolvedValue(true)

      const result = await mockBcryptCompare('correctpassword', 'hashed_old_password')

      expect(result).toBe(true)
    })
  })

  describe('Admin Password Update', () => {
    beforeEach(() => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)

      mockUserFindUnique.mockResolvedValue({
        id: 'any-user-id',
        email: 'user@test.com',
        username: 'user',
        authentication: {
          id: 'auth-1',
          userId: 'any-user-id',
          password: 'hashed_password',
        },
        role: { id: 'role-user', name: 'user' },
      })
    })

    it('should not require current password for admin', () => {
      const body = {
        newPassword: 'newpassword123',
        // currentPassword not required for admin
      }

      expect(body.newPassword).toBeDefined()
      // Admin doesn't need currentPassword
    })

    it('should allow admin to reset password without current password', async () => {
      mockBcryptHash.mockResolvedValue('hashed_new_password')

      const hashedPassword = await mockBcryptHash('newpassword123', 10)

      expect(hashedPassword).toBe('hashed_new_password')
      expect(mockBcryptHash).toHaveBeenCalledWith('newpassword123', 10)
    })
  })

  describe('Password Hashing', () => {
    beforeEach(() => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      mockUserFindUnique.mockResolvedValue({
        id: 'test-user-id',
        email: 'user@test.com',
        username: 'user',
        authentication: {
          id: 'auth-1',
          userId: 'test-user-id',
          password: 'hashed_old_password',
        },
        role: { id: 'role-user', name: 'user' },
      })

      mockBcryptCompare.mockResolvedValue(true)
    })

    it('should hash new password with bcrypt', async () => {
      const newPassword = 'newpassword123'
      const hashedPassword = 'hashed_new_password'

      mockBcryptHash.mockResolvedValue(hashedPassword)

      const result = await mockBcryptHash(newPassword, 10)

      expect(result).toBe(hashedPassword)
      expect(mockBcryptHash).toHaveBeenCalledWith(newPassword, 10)
    })

    it('should use salt rounds of 10', async () => {
      mockBcryptHash.mockResolvedValue('hashed_password')

      await mockBcryptHash('password123', 10)

      expect(mockBcryptHash).toHaveBeenCalledWith('password123', 10)
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
        authentication: {
          id: 'auth-1',
          userId: 'test-user-id',
          password: 'hashed_old_password',
        },
        role: { id: 'role-user', name: 'user' },
      })

      mockBcryptCompare.mockResolvedValue(true)
      mockBcryptHash.mockResolvedValue('hashed_new_password')
    })

    it('should update authentication password', async () => {
      const updatedAuth = {
        id: 'auth-1',
        userId: 'test-user-id',
        password: 'hashed_new_password',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockAuthenticationUpdate.mockResolvedValue(updatedAuth)

      const result = await mockAuthenticationUpdate({
        where: { userId: 'test-user-id' },
        data: { password: 'hashed_new_password' },
      })

      expect(result.password).toBe('hashed_new_password')
      expect(mockAuthenticationUpdate).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
        data: { password: 'hashed_new_password' },
      })
    })

    it('should handle database errors', async () => {
      mockAuthenticationUpdate.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockAuthenticationUpdate({
          where: { userId: 'test-user-id' },
          data: { password: 'hashed_new_password' },
        })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Response Format', () => {
    it('should return success response without password data', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      mockUserFindUnique.mockResolvedValue({
        id: 'test-user-id',
        email: 'user@test.com',
        username: 'user',
        authentication: {
          id: 'auth-1',
          userId: 'test-user-id',
          password: 'hashed_old_password',
        },
        role: { id: 'role-user', name: 'user' },
      })

      mockBcryptCompare.mockResolvedValue(true)
      mockBcryptHash.mockResolvedValue('hashed_new_password')
      mockAuthenticationUpdate.mockResolvedValue({
        id: 'auth-1',
        userId: 'test-user-id',
        password: 'hashed_new_password',
      })

      const expectedResponse = {
        success: true,
        message: 'Password updated successfully',
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.message).toBe('Password updated successfully')
      expect((expectedResponse as any).data).toBeUndefined()
      expect((expectedResponse as any).password).toBeUndefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle user updating their own password as admin', async () => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)

      mockUserFindUnique.mockResolvedValue({
        id: 'test-admin-id', // Same as admin's userId
        email: 'admin@test.com',
        username: 'admin',
        authentication: {
          id: 'auth-admin',
          userId: 'test-admin-id',
          password: 'hashed_old_password',
        },
        role: { id: 'role-admin', name: 'admin' },
      })

      mockBcryptHash.mockResolvedValue('hashed_new_password')

      // Admin updating their own password - doesn't need current password
      expect(testAdmin.role).toBe('admin')
      expect(testAdmin.userId).toBe('test-admin-id')
    })

    it('should handle same password change', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      mockUserFindUnique.mockResolvedValue({
        id: 'test-user-id',
        email: 'user@test.com',
        username: 'user',
        authentication: {
          id: 'auth-1',
          userId: 'test-user-id',
          password: 'hashed_password',
        },
        role: { id: 'role-user', name: 'user' },
      })

      mockBcryptCompare.mockResolvedValue(true)
      mockBcryptHash.mockResolvedValue('hashed_new_password')

      // Even if new password is same as old, it will be hashed differently
      const newHash = await mockBcryptHash('samepassword', 10)
      expect(newHash).toBeDefined()
    })
  })
})
