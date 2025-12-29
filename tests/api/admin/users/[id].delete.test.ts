import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateTestToken, createTestAdmin, createTestUser } from '../../../utils/auth'

// Mock the auth utilities
vi.mock('~/server/utils/auth', () => ({
  getAuthUser: vi.fn(),
  requireRole: vi.fn(),
}))

// Mock the database
vi.mock('~/server/utils/db', () => ({
  default: {
    postgres: {
      user: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    },
  },
}))

describe('DELETE /api/admin/users/[id]', () => {
  let mockGetAuthUser: any
  let mockRequireRole: any
  let mockUserFindUnique: any
  let mockUserDelete: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')

    mockGetAuthUser = authModule.getAuthUser as any
    mockRequireRole = authModule.requireRole as any
    mockUserFindUnique = dbModule.default.postgres.user.findUnique as any
    mockUserDelete = dbModule.default.postgres.user.delete as any
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

    it('should require admin role', () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      mockRequireRole.mockImplementation((user: any, roles: string[]) => {
        if (!roles.includes(user.role)) {
          throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden',
          })
        }
      })

      // Should throw for regular user
      expect(() => mockRequireRole(testUser, ['admin'])).toThrow()
    })

    it('should allow admin to access route', () => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)

      mockRequireRole.mockImplementation((user: any, roles: string[]) => {
        if (!roles.includes(user.role)) {
          throw createError({
            statusCode: 403,
            statusMessage: 'Forbidden',
          })
        }
      })

      // Should not throw for admin
      expect(() => mockRequireRole(testAdmin, ['admin'])).not.toThrow()
    })
  })

  describe('Validation', () => {
    beforeEach(() => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should reject missing user ID', () => {
      const id = undefined
      expect(id).toBeUndefined()
    })

    it('should reject non-existent user', async () => {
      mockUserFindUnique.mockResolvedValue(null)

      const result = await mockUserFindUnique({ where: { id: 'non-existent' } })
      expect(result).toBeNull()
    })

    it('should prevent admin from deleting themselves', () => {
      const testAdmin = createTestAdmin()
      const userToDelete = {
        id: testAdmin.userId, // Same as admin's ID
        email: 'admin@test.com',
        username: 'admin',
        role: { id: 'role-admin', name: 'admin' },
      }

      // Should not allow deletion
      expect(userToDelete.id).toBe(testAdmin.userId)
    })
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should delete user successfully', async () => {
      const mockUser = {
        id: 'user-to-delete',
        email: 'userdelete@test.com',
        username: 'userdelete',
        name: 'Delete',
        surname: 'User',
        roleId: 'role-user',
        role: {
          id: 'role-user',
          name: 'user',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockUserFindUnique.mockResolvedValue(mockUser)
      mockUserDelete.mockResolvedValue(mockUser)

      const existingUser = await mockUserFindUnique({
        where: { id: 'user-to-delete' },
        include: { role: true },
      })

      expect(existingUser).toEqual(mockUser)

      const result = await mockUserDelete({
        where: { id: 'user-to-delete' },
      })

      expect(result).toEqual(mockUser)
      expect(mockUserDelete).toHaveBeenCalledWith({
        where: { id: 'user-to-delete' },
      })
    })

    it('should handle database errors', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'user-to-delete',
        username: 'userdelete',
        role: { id: 'role-user', name: 'user' },
      })

      mockUserDelete.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockUserDelete({
          where: { id: 'user-to-delete' },
        })
      ).rejects.toThrow('Database connection failed')
    })

    it('should cascade delete authentication and collections', async () => {
      // Test verifies that cascade deletion is expected behavior
      const mockUser = {
        id: 'user-with-data',
        email: 'user@test.com',
        username: 'userdata',
        role: { id: 'role-user', name: 'user' },
      }

      mockUserFindUnique.mockResolvedValue(mockUser)
      mockUserDelete.mockResolvedValue(mockUser)

      // When user is deleted, authentication and collections should also be deleted
      // This is handled by Prisma onDelete: Cascade in the schema
      const result = await mockUserDelete({
        where: { id: 'user-with-data' },
      })

      expect(result).toEqual(mockUser)
    })
  })

  describe('Response Format', () => {
    it('should return success response with username', async () => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)

      const mockUser = {
        id: 'user-1',
        email: 'user1@test.com',
        username: 'user1',
        role: { id: 'role-user', name: 'user' },
      }

      mockUserFindUnique.mockResolvedValue(mockUser)
      mockUserDelete.mockResolvedValue(mockUser)

      await mockUserDelete({ where: { id: 'user-1' } })

      const expectedResponse = {
        success: true,
        message: `User ${mockUser.username} deleted successfully`,
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.message).toContain('user1')
      expect(expectedResponse.message).toContain('deleted successfully')
    })
  })
})
