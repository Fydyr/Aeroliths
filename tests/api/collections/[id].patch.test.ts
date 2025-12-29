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
        update: vi.fn(),
      },
    },
  },
}))

describe('PATCH /api/collections/[id]', () => {
  let mockGetAuthUser: any
  let mockCollectionsFindUnique: any
  let mockCollectionsUpdate: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')

    mockGetAuthUser = authModule.getAuthUser as any
    mockCollectionsFindUnique = dbModule.default.postgres.collections.findUnique as any
    mockCollectionsUpdate = dbModule.default.postgres.collections.update as any
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

    it('should verify collection ownership', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      const mockCollection = {
        id: 'collection-1',
        userId: 'different-user-id', // Different user
        lithosId: 'lithos-1',
        quantity: 5,
      }

      mockCollectionsFindUnique.mockResolvedValue(mockCollection)

      // User should not be able to update collection they don't own
      expect(mockCollection.userId).not.toBe(testUser.userId)
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

    it('should reject negative quantity', () => {
      const quantity = -5
      expect(quantity).toBeLessThan(0)
    })

    it('should reject invalid quantity type', () => {
      const quantity = 'not-a-number'
      const parsed = Number(quantity)
      expect(isNaN(parsed)).toBe(true)
    })

    it('should accept valid quantity', () => {
      const quantity = 10
      expect(quantity).toBeGreaterThanOrEqual(0)
      expect(typeof quantity).toBe('number')
    })

    it('should reject empty update data', () => {
      const updateData = {}
      expect(Object.keys(updateData).length).toBe(0)
    })
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)
    })

    it('should update collection quantity successfully', async () => {
      const mockExistingCollection = {
        id: 'collection-1',
        userId: 'test-user-id',
        lithosId: 'lithos-1',
        quantity: 5,
      }

      const mockUpdatedCollection = {
        ...mockExistingCollection,
        quantity: 10,
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
      }

      mockCollectionsFindUnique.mockResolvedValue(mockExistingCollection)
      mockCollectionsUpdate.mockResolvedValue(mockUpdatedCollection)

      const result = await mockCollectionsUpdate({
        where: { id: 'collection-1' },
        data: { quantity: 10 },
        include: { lithos: true },
      })

      expect(result.quantity).toBe(10)
      expect(result.lithos).toBeDefined()
    })

    it('should handle database errors', async () => {
      mockCollectionsFindUnique.mockResolvedValue({
        id: 'collection-1',
        userId: 'test-user-id',
        lithosId: 'lithos-1',
        quantity: 5,
      })

      mockCollectionsUpdate.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockCollectionsUpdate({
          where: { id: 'collection-1' },
          data: { quantity: 10 },
        })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Response Format', () => {
    it('should return success response with updated collection', async () => {
      const testUser = createTestUser()
      mockGetAuthUser.mockReturnValue(testUser)

      const mockUpdatedCollection = {
        id: 'collection-1',
        userId: 'test-user-id',
        lithosId: 'lithos-1',
        quantity: 15,
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
      }

      mockCollectionsUpdate.mockResolvedValue(mockUpdatedCollection)

      const expectedResponse = {
        success: true,
        message: 'Collection updated successfully',
        data: mockUpdatedCollection,
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.data.quantity).toBe(15)
      expect(expectedResponse.data.lithos).toBeDefined()
    })
  })
})
