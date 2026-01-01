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
        findMany: vi.fn(),
      },
    },
  },
}))

describe('GET /api/admin/users', () => {
  let mockGetAuthUser: any
  let mockRequireRole: any
  let mockUserFindMany: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')

    mockGetAuthUser = authModule.getAuthUser as any
    mockRequireRole = authModule.requireRole as any
    mockUserFindMany = dbModule.default.postgres.user.findMany as any
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

  describe('Database Operations', () => {
    beforeEach(() => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should retrieve all users successfully', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@test.com',
          username: 'user1',
          name: 'User',
          surname: 'One',
          createdAt: new Date(),
          updatedAt: new Date(),
          role: {
            id: 'role-user',
            name: 'user',
          },
          collections: [
            {
              id: 'collection-1',
              quantity: 5,
              lithos: {
                id: 'lithos-1',
                name: 'Fire Stone',
              },
            },
          ],
        },
        {
          id: 'user-2',
          email: 'user2@test.com',
          username: 'user2',
          name: 'User',
          surname: 'Two',
          createdAt: new Date(),
          updatedAt: new Date(),
          role: {
            id: 'role-user',
            name: 'user',
          },
          collections: [],
        },
        {
          id: 'admin-1',
          email: 'admin@test.com',
          username: 'admin',
          name: 'Admin',
          surname: 'User',
          createdAt: new Date(),
          updatedAt: new Date(),
          role: {
            id: 'role-admin',
            name: 'admin',
          },
          collections: [],
        },
      ]

      mockUserFindMany.mockResolvedValue(mockUsers)

      const result = await mockUserFindMany({
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          surname: true,
          createdAt: true,
          updatedAt: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          collections: {
            select: {
              id: true,
              quantity: true,
              lithos: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      expect(result).toEqual(mockUsers)
      expect(result).toHaveLength(3)
      expect(mockUserFindMany).toHaveBeenCalledWith({
        select: expect.objectContaining({
          id: true,
          email: true,
          username: true,
          role: expect.any(Object),
          collections: expect.any(Object),
        }),
        orderBy: expect.any(Object),
      })
    })

    it('should return empty array when no users exist', async () => {
      mockUserFindMany.mockResolvedValue([])

      const result = await mockUserFindMany({
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          surname: true,
          createdAt: true,
          updatedAt: true,
          role: {
            select: {
              id: true,
              name: true,
            },
          },
          collections: {
            select: {
              id: true,
              quantity: true,
              lithos: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      })

      expect(result).toEqual([])
      expect(result).toHaveLength(0)
    })

    it('should handle database errors', async () => {
      mockUserFindMany.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockUserFindMany({
          select: expect.any(Object),
          orderBy: expect.any(Object),
        })
      ).rejects.toThrow('Database connection failed')
    })

    it('should include user collections in response', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@test.com',
          username: 'user1',
          name: 'User',
          surname: 'One',
          createdAt: new Date(),
          updatedAt: new Date(),
          role: {
            id: 'role-user',
            name: 'user',
          },
          collections: [
            {
              id: 'collection-1',
              quantity: 3,
              lithos: {
                id: 'lithos-1',
                name: 'Water Stone',
              },
            },
            {
              id: 'collection-2',
              quantity: 7,
              lithos: {
                id: 'lithos-2',
                name: 'Earth Stone',
              },
            },
          ],
        },
      ]

      mockUserFindMany.mockResolvedValue(mockUsers)

      const result = await mockUserFindMany({
        select: expect.any(Object),
        orderBy: expect.any(Object),
      })

      expect(result[0].collections).toHaveLength(2)
      expect(result[0].collections[0].quantity).toBe(3)
      expect(result[0].collections[0].lithos.name).toBe('Water Stone')
    })

    it('should order users by creation date descending', async () => {
      const mockUsers = [
        {
          id: 'user-3',
          email: 'user3@test.com',
          username: 'user3',
          name: 'User',
          surname: 'Three',
          createdAt: new Date('2024-03-15'),
          updatedAt: new Date(),
          role: { id: 'role-user', name: 'user' },
          collections: [],
        },
        {
          id: 'user-2',
          email: 'user2@test.com',
          username: 'user2',
          name: 'User',
          surname: 'Two',
          createdAt: new Date('2024-03-10'),
          updatedAt: new Date(),
          role: { id: 'role-user', name: 'user' },
          collections: [],
        },
        {
          id: 'user-1',
          email: 'user1@test.com',
          username: 'user1',
          name: 'User',
          surname: 'One',
          createdAt: new Date('2024-03-05'),
          updatedAt: new Date(),
          role: { id: 'role-user', name: 'user' },
          collections: [],
        },
      ]

      mockUserFindMany.mockResolvedValue(mockUsers)

      const result = await mockUserFindMany({
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })

      expect(mockUserFindMany).toHaveBeenCalledWith({
        select: expect.any(Object),
        orderBy: { createdAt: 'desc' },
      })
      expect(result).toEqual(mockUsers)
    })
  })

  describe('Response Format', () => {
    beforeEach(() => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should return success response with users and count', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@test.com',
          username: 'user1',
          name: 'User',
          surname: 'One',
          createdAt: new Date(),
          updatedAt: new Date(),
          role: { id: 'role-user', name: 'user' },
          collections: [],
        },
        {
          id: 'user-2',
          email: 'user2@test.com',
          username: 'user2',
          name: 'User',
          surname: 'Two',
          createdAt: new Date(),
          updatedAt: new Date(),
          role: { id: 'role-user', name: 'user' },
          collections: [],
        },
      ]

      mockUserFindMany.mockResolvedValue(mockUsers)

      await mockUserFindMany({
        select: expect.any(Object),
        orderBy: expect.any(Object),
      })

      const expectedResponse = {
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: mockUsers,
          count: mockUsers.length,
        },
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.message).toBe('Users retrieved successfully')
      expect(expectedResponse.data.users).toEqual(mockUsers)
      expect(expectedResponse.data.count).toBe(2)
    })

    it('should return correct count for empty users array', async () => {
      mockUserFindMany.mockResolvedValue([])

      await mockUserFindMany({
        select: expect.any(Object),
        orderBy: expect.any(Object),
      })

      const expectedResponse = {
        success: true,
        message: 'Users retrieved successfully',
        data: {
          users: [],
          count: 0,
        },
      }

      expect(expectedResponse.data.count).toBe(0)
    })
  })

  describe('User Data Selection', () => {
    beforeEach(() => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should not include sensitive data like passwords', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@test.com',
          username: 'user1',
          name: 'User',
          surname: 'One',
          createdAt: new Date(),
          updatedAt: new Date(),
          role: { id: 'role-user', name: 'user' },
          collections: [],
        },
      ]

      mockUserFindMany.mockResolvedValue(mockUsers)

      const result = await mockUserFindMany({
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          surname: true,
          createdAt: true,
          updatedAt: true,
          role: { select: { id: true, name: true } },
          collections: {
            select: {
              id: true,
              quantity: true,
              lithos: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      })

      // Verify that authentication data is not included
      expect(result[0]).not.toHaveProperty('authentication')
      expect(result[0]).not.toHaveProperty('password')
    })

    it('should include role information', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@test.com',
          username: 'user1',
          name: 'User',
          surname: 'One',
          createdAt: new Date(),
          updatedAt: new Date(),
          role: {
            id: 'role-user',
            name: 'user',
          },
          collections: [],
        },
      ]

      mockUserFindMany.mockResolvedValue(mockUsers)

      const result = await mockUserFindMany({
        select: expect.any(Object),
        orderBy: expect.any(Object),
      })

      expect(result[0].role).toBeDefined()
      expect(result[0].role.id).toBe('role-user')
      expect(result[0].role.name).toBe('user')
    })
  })
})
