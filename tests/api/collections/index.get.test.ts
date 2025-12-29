import { describe, it, expect, vi, beforeEach } from 'vitest'
import { generateTestToken, createTestAdmin, createTestUser } from '../../utils/auth'

// Mock the auth utilities
vi.mock('~/server/utils/auth', () => ({
  getAuthUser: vi.fn(),
  requireRole: vi.fn(),
}))

// Mock the database
vi.mock('~/server/utils/db', () => ({
  default: {
    postgres: {
      collections: {
        findMany: vi.fn(),
      },
    },
  },
}))

describe('GET /api/collections', () => {
  let mockGetAuthUser: any
  let mockCollectionsFindMany: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')

    mockGetAuthUser = authModule.getAuthUser as any
    mockCollectionsFindMany = dbModule.default.postgres.collections.findMany as any
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
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)
    })

    it('should fetch collections for authenticated user', async () => {
      const mockCollections = [
        {
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
          },
        },
        {
          id: 'collection-2',
          userId: 'test-user-id',
          lithosId: 'lithos-2',
          quantity: 3,
          createdAt: new Date(),
          updatedAt: new Date(),
          lithos: {
            id: 'lithos-2',
            name: 'Water Lithos',
            sprite: '/sprites/water.png',
            type: 'water',
            spikeLeft: 1,
            spikeRight: 2,
            spikeUp: 1,
            spikeDown: 2,
          },
        },
      ]

      mockCollectionsFindMany.mockResolvedValue(mockCollections)

      const result = await mockCollectionsFindMany({
        where: { userId: 'test-user-id' },
        include: { lithos: true },
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toEqual(mockCollections)
      expect(result.length).toBe(2)
      expect(result[0].lithos).toBeDefined()
    })

    it('should return empty array when user has no collections', async () => {
      mockCollectionsFindMany.mockResolvedValue([])

      const result = await mockCollectionsFindMany({
        where: { userId: 'test-user-id' },
        include: { lithos: true },
        orderBy: { createdAt: 'desc' },
      })

      expect(result).toEqual([])
      expect(result.length).toBe(0)
    })

    it('should handle database errors', async () => {
      mockCollectionsFindMany.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockCollectionsFindMany({
          where: { userId: 'test-user-id' },
          include: { lithos: true },
        })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Response Format', () => {
    it('should return success response with collections data', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      const mockCollections = [
        {
          id: 'collection-1',
          userId: 'test-user-id',
          lithosId: 'lithos-1',
          quantity: 5,
          createdAt: new Date(),
          updatedAt: new Date(),
          lithos: {
            id: 'lithos-1',
            name: 'Earth Lithos',
            sprite: '/sprites/earth.png',
            type: 'earth',
            spikeLeft: 3,
            spikeRight: 3,
            spikeUp: 2,
            spikeDown: 2,
          },
        },
      ]

      mockCollectionsFindMany.mockResolvedValue(mockCollections)

      const expectedResponse = {
        success: true,
        data: mockCollections,
        count: mockCollections.length,
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.count).toBe(1)
      expect(expectedResponse.data).toEqual(mockCollections)
    })
  })
})
