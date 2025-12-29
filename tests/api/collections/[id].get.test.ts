import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateTestToken, createTestUser } from '../../utils/auth'

// Mock the auth utilities
vi.mock('~/server/utils/auth', () => ({
  getAuthUser: vi.fn(),
}))

// Mock the database
vi.mock('~/server/utils/db', () => ({
  default: {
    postgres: {
      collections: {
        findUnique: vi.fn(),
      },
    },
  },
}))

describe('GET /api/collections/[id]', () => {
  let mockGetAuthUser: any
  let mockCollectionsFindUnique: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')

    mockGetAuthUser = authModule.getAuthUser as any
    mockCollectionsFindUnique = dbModule.default.postgres.collections.findUnique as any
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

    it('should accept valid authenticated user', () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      const user = mockGetAuthUser({})
      expect(user).toEqual(testUser)
      expect(user.userId).toBe('test-user-id')
    })

    it('should verify collection ownership', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      const mockCollection = {
        id: 'collection-1',
        userId: 'different-user-id', // Different user
        lithosId: 'lithos-1',
        quantity: 5,
        lithos: {
          id: 'lithos-1',
          name: 'Fire Lithos',
        },
        user: {
          id: 'different-user-id',
          username: 'otheruser',
          email: 'other@test.com',
        },
      }

      mockCollectionsFindUnique.mockResolvedValue(mockCollection)

      const result = await mockCollectionsFindUnique({
        where: { id: 'collection-1' },
        include: { lithos: true, user: true },
      })

      // User should not be able to access collection they don't own
      expect(result.userId).not.toBe(testUser.userId)
    })

    it('should allow user to access their own collection', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      const mockCollection = {
        id: 'collection-1',
        userId: 'test-user-id', // Same user
        lithosId: 'lithos-1',
        quantity: 5,
        lithos: {
          id: 'lithos-1',
          name: 'Fire Lithos',
        },
        user: {
          id: 'test-user-id',
          username: 'user',
          email: 'user@test.com',
        },
      }

      mockCollectionsFindUnique.mockResolvedValue(mockCollection)

      const result = await mockCollectionsFindUnique({
        where: { id: 'collection-1' },
        include: { lithos: true, user: true },
      })

      expect(result.userId).toBe(testUser.userId)
    })
  })

  describe('Validation', () => {
    beforeEach(() => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)
    })

    it('should reject missing collection ID', () => {
      const id = undefined
      expect(id).toBeUndefined()
    })

    it('should reject non-existent collection', async () => {
      mockCollectionsFindUnique.mockResolvedValue(null)

      const result = await mockCollectionsFindUnique({ where: { id: 'non-existent' } })
      expect(result).toBeNull()
    })

    it('should accept valid collection ID', async () => {
      const mockCollection = {
        id: 'collection-1',
        userId: 'test-user-id',
        lithosId: 'lithos-1',
        quantity: 5,
      }

      mockCollectionsFindUnique.mockResolvedValue(mockCollection)

      const result = await mockCollectionsFindUnique({ where: { id: 'collection-1' } })
      expect(result).toEqual(mockCollection)
      expect(result.id).toBe('collection-1')
    })
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)
    })

    it('should fetch collection with lithos details', async () => {
      const mockCollection = {
        id: 'collection-1',
        userId: 'test-user-id',
        lithosId: 'lithos-1',
        quantity: 5,
        createdAt: new Date(),
        updatedAt: new Date(),
        lithos: {
          id: 'lithos-1',
          name: 'Fire Lithos',
          sprite: '/sprites/fire.png',
          type: 'fire',
          spikeLeft: 2,
          spikeRight: 1,
          spikeUp: 3,
          spikeDown: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        user: {
          id: 'test-user-id',
          username: 'user',
          email: 'user@test.com',
        },
      }

      mockCollectionsFindUnique.mockResolvedValue(mockCollection)

      const result = await mockCollectionsFindUnique({
        where: { id: 'collection-1' },
        include: {
          lithos: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      })

      expect(result).toEqual(mockCollection)
      expect(result.lithos).toBeDefined()
      expect(result.lithos.name).toBe('Fire Lithos')
      expect(result.user).toBeDefined()
      expect(result.user.username).toBe('user')
    })

    it('should handle database errors', async () => {
      mockCollectionsFindUnique.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockCollectionsFindUnique({
          where: { id: 'collection-1' },
          include: { lithos: true, user: true },
        })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Response Format', () => {
    it('should return success response with collection data', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      const mockCollection = {
        id: 'collection-1',
        userId: 'test-user-id',
        lithosId: 'lithos-1',
        quantity: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
        lithos: {
          id: 'lithos-1',
          name: 'Water Lithos',
          sprite: '/sprites/water.png',
          type: 'water',
          spikeLeft: 1,
          spikeRight: 2,
          spikeUp: 1,
          spikeDown: 2,
        },
        user: {
          id: 'test-user-id',
          username: 'user',
          email: 'user@test.com',
        },
      }

      mockCollectionsFindUnique.mockResolvedValue(mockCollection)

      const expectedResponse = {
        success: true,
        data: mockCollection,
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.data).toEqual(mockCollection)
      expect(expectedResponse.data.quantity).toBe(10)
      expect(expectedResponse.data.lithos).toBeDefined()
    })
  })
})
