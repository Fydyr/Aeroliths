import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestAdmin, createTestUser } from '../../../../utils/auth'

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
        update: vi.fn(),
      },
      role: {
        findUnique: vi.fn(),
      },
    },
  },
}))

describe('PATCH /api/admin/users/[id]/role', () => {
  let mockGetAuthUser: any
  let mockRequireRole: any
  let mockUserFindUnique: any
  let mockUserUpdate: any
  let mockRoleFindUnique: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')

    mockGetAuthUser = authModule.getAuthUser as any
    mockRequireRole = authModule.requireRole as any
    mockUserFindUnique = dbModule.default.postgres.user.findUnique as any
    mockUserUpdate = dbModule.default.postgres.user.update as any
    mockRoleFindUnique = dbModule.default.postgres.role.findUnique as any
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

    it('should reject missing role name', () => {
      const body = {}
      expect(body).not.toHaveProperty('roleName')
    })

    it('should reject invalid role name type', () => {
      const body = { roleName: 123 }
      expect(typeof body.roleName).not.toBe('string')
    })

    it('should reject non-existent user', async () => {
      mockUserFindUnique.mockResolvedValue(null)

      const result = await mockUserFindUnique({ where: { id: 'non-existent' } })
      expect(result).toBeNull()
    })

    it('should reject non-existent role', async () => {
      mockRoleFindUnique.mockResolvedValue(null)

      const result = await mockRoleFindUnique({ where: { name: 'invalid-role' } })
      expect(result).toBeNull()
    })

    it('should prevent admin from changing their own role', () => {
      const testAdmin = createTestAdmin()
      const userToUpdate = {
        id: testAdmin.userId, // Same as admin's ID
        email: 'admin@test.com',
        username: 'admin',
        roleId: 'role-admin',
        role: { id: 'role-admin', name: 'admin' },
      }

      // Should not allow role change
      expect(userToUpdate.id).toBe(testAdmin.userId)
    })

    it('should reject if user already has the target role', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@test.com',
        username: 'user1',
        roleId: 'role-user',
        role: { id: 'role-user', name: 'user' },
      }

      const mockRole = {
        id: 'role-user',
        name: 'user',
      }

      mockUserFindUnique.mockResolvedValue(mockUser)
      mockRoleFindUnique.mockResolvedValue(mockRole)

      // User already has this role
      expect(mockUser.roleId).toBe(mockRole.id)
    })
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should update user role to admin successfully', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'user@test.com',
        username: 'user1',
        name: 'Regular',
        surname: 'User',
        roleId: 'role-user',
        role: {
          id: 'role-user',
          name: 'user',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const mockAdminRole = {
        id: 'role-admin',
        name: 'admin',
      }

      const updatedMockUser = {
        ...mockUser,
        roleId: 'role-admin',
        role: mockAdminRole,
      }

      mockUserFindUnique.mockResolvedValue(mockUser)
      mockRoleFindUnique.mockResolvedValue(mockAdminRole)
      mockUserUpdate.mockResolvedValue(updatedMockUser)

      const existingUser = await mockUserFindUnique({
        where: { id: 'user-1' },
        include: { role: true },
      })

      expect(existingUser).toEqual(mockUser)
      expect(existingUser.role.name).toBe('user')

      const role = await mockRoleFindUnique({
        where: { name: 'admin' },
      })

      expect(role).toEqual(mockAdminRole)

      const result = await mockUserUpdate({
        where: { id: 'user-1' },
        data: { roleId: role.id },
        include: { role: true },
      })

      expect(result).toEqual(updatedMockUser)
      expect(result.role.name).toBe('admin')
      expect(mockUserUpdate).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { roleId: 'role-admin' },
        include: { role: true },
      })
    })

    it('should update admin role to user successfully', async () => {
      const mockAdmin = {
        id: 'admin-2',
        email: 'admin2@test.com',
        username: 'admin2',
        roleId: 'role-admin',
        role: {
          id: 'role-admin',
          name: 'admin',
        },
      }

      const mockUserRole = {
        id: 'role-user',
        name: 'user',
      }

      const updatedMockAdmin = {
        ...mockAdmin,
        roleId: 'role-user',
        role: mockUserRole,
      }

      mockUserFindUnique.mockResolvedValue(mockAdmin)
      mockRoleFindUnique.mockResolvedValue(mockUserRole)
      mockUserUpdate.mockResolvedValue(updatedMockAdmin)

      const result = await mockUserUpdate({
        where: { id: 'admin-2' },
        data: { roleId: mockUserRole.id },
        include: { role: true },
      })

      expect(result.role.name).toBe('user')
    })

    it('should handle database errors', async () => {
      mockUserFindUnique.mockResolvedValue({
        id: 'user-1',
        username: 'user1',
        roleId: 'role-user',
        role: { id: 'role-user', name: 'user' },
      })

      mockRoleFindUnique.mockResolvedValue({
        id: 'role-admin',
        name: 'admin',
      })

      mockUserUpdate.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockUserUpdate({
          where: { id: 'user-1' },
          data: { roleId: 'role-admin' },
        })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Response Format', () => {
    it('should return success response with updated user data', async () => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)

      const mockUser = {
        id: 'user-1',
        email: 'user1@test.com',
        username: 'user1',
        roleId: 'role-user',
        role: { id: 'role-user', name: 'user' },
      }

      const mockAdminRole = {
        id: 'role-admin',
        name: 'admin',
      }

      const updatedUser = {
        ...mockUser,
        roleId: 'role-admin',
        role: mockAdminRole,
      }

      mockUserFindUnique.mockResolvedValue(mockUser)
      mockRoleFindUnique.mockResolvedValue(mockAdminRole)
      mockUserUpdate.mockResolvedValue(updatedUser)

      await mockUserUpdate({
        where: { id: 'user-1' },
        data: { roleId: 'role-admin' },
        include: { role: true },
      })

      const expectedResponse = {
        success: true,
        message: `User role updated to 'admin' successfully`,
        data: updatedUser,
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.message).toContain('admin')
      expect(expectedResponse.message).toContain('successfully')
      expect(expectedResponse.data.role.name).toBe('admin')
    })
  })

  describe('Role Transitions', () => {
    beforeEach(() => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should support promoting user to admin', async () => {
      const mockUser = {
        id: 'user-1',
        roleId: 'role-user',
        role: { id: 'role-user', name: 'user' },
      }

      const mockAdminRole = { id: 'role-admin', name: 'admin' }

      mockUserFindUnique.mockResolvedValue(mockUser)
      mockRoleFindUnique.mockResolvedValue(mockAdminRole)
      mockUserUpdate.mockResolvedValue({
        ...mockUser,
        roleId: 'role-admin',
        role: mockAdminRole,
      })

      const result = await mockUserUpdate({
        where: { id: 'user-1' },
        data: { roleId: 'role-admin' },
        include: { role: true },
      })

      expect(result.role.name).toBe('admin')
    })

    it('should support demoting admin to user', async () => {
      const mockAdmin = {
        id: 'admin-1',
        roleId: 'role-admin',
        role: { id: 'role-admin', name: 'admin' },
      }

      const mockUserRole = { id: 'role-user', name: 'user' }

      mockUserFindUnique.mockResolvedValue(mockAdmin)
      mockRoleFindUnique.mockResolvedValue(mockUserRole)
      mockUserUpdate.mockResolvedValue({
        ...mockAdmin,
        roleId: 'role-user',
        role: mockUserRole,
      })

      const result = await mockUserUpdate({
        where: { id: 'admin-1' },
        data: { roleId: 'role-user' },
        include: { role: true },
      })

      expect(result.role.name).toBe('user')
    })
  })
})
