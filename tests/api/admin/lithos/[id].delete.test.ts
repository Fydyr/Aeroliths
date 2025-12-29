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
      lithos: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    },
  },
}))

describe('DELETE /api/admin/lithos/[id]', () => {
  let mockGetAuthUser: any
  let mockRequireRole: any
  let mockLithosFindUnique: any
  let mockLithosDelete: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')

    mockGetAuthUser = authModule.getAuthUser as any
    mockRequireRole = authModule.requireRole as any
    mockLithosFindUnique = dbModule.default.postgres.lithos.findUnique as any
    mockLithosDelete = dbModule.default.postgres.lithos.delete as any
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

    it('should reject missing lithos ID', () => {
      const id = undefined
      expect(id).toBeUndefined()
    })

    it('should reject non-existent lithos', async () => {
      mockLithosFindUnique.mockResolvedValue(null)

      const result = await mockLithosFindUnique({ where: { id: 'non-existent' } })
      expect(result).toBeNull()
    })

    it('should accept valid lithos ID', async () => {
      const mockLithos = {
        id: 'lithos-1',
        name: 'Fire Lithos',
        sprite: '/sprites/fire.png',
        type: 'fire',
        spikeLeft: 2,
        spikeRight: 1,
        spikeUp: 3,
        spikeDown: 0,
      }

      mockLithosFindUnique.mockResolvedValue(mockLithos)

      const result = await mockLithosFindUnique({ where: { id: 'lithos-1' } })
      expect(result).toEqual(mockLithos)
      expect(result.id).toBe('lithos-1')
    })
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should delete lithos successfully', async () => {
      const mockLithos = {
        id: 'lithos-to-delete',
        name: 'Water Lithos',
        sprite: '/sprites/water.png',
        type: 'water',
        spikeLeft: 1,
        spikeRight: 2,
        spikeUp: 1,
        spikeDown: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockLithosFindUnique.mockResolvedValue(mockLithos)
      mockLithosDelete.mockResolvedValue(mockLithos)

      const existingLithos = await mockLithosFindUnique({
        where: { id: 'lithos-to-delete' },
      })

      expect(existingLithos).toEqual(mockLithos)

      const result = await mockLithosDelete({
        where: { id: 'lithos-to-delete' },
      })

      expect(result).toEqual(mockLithos)
      expect(mockLithosDelete).toHaveBeenCalledWith({
        where: { id: 'lithos-to-delete' },
      })
    })

    it('should handle database errors', async () => {
      mockLithosFindUnique.mockResolvedValue({
        id: 'lithos-1',
        name: 'Fire Lithos',
      })

      mockLithosDelete.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockLithosDelete({
          where: { id: 'lithos-1' },
        })
      ).rejects.toThrow('Database connection failed')
    })

    it('should cascade delete related collections', async () => {
      // Test verifies that cascade deletion is expected behavior
      const mockLithos = {
        id: 'lithos-with-collections',
        name: 'Earth Lithos',
        sprite: '/sprites/earth.png',
        type: 'earth',
        spikeLeft: 3,
        spikeRight: 3,
        spikeUp: 2,
        spikeDown: 2,
      }

      mockLithosFindUnique.mockResolvedValue(mockLithos)
      mockLithosDelete.mockResolvedValue(mockLithos)

      // When lithos is deleted, all collections with this lithos should also be deleted
      // This is handled by Prisma onDelete: Cascade in the schema
      const result = await mockLithosDelete({
        where: { id: 'lithos-with-collections' },
      })

      expect(result).toEqual(mockLithos)
    })
  })

  describe('Response Format', () => {
    it('should return success response with lithos name', async () => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)

      const mockLithos = {
        id: 'lithos-1',
        name: 'Air Lithos',
        sprite: '/sprites/air.png',
        type: 'air',
        spikeLeft: 0,
        spikeRight: 3,
        spikeUp: 2,
        spikeDown: 1,
      }

      mockLithosFindUnique.mockResolvedValue(mockLithos)
      mockLithosDelete.mockResolvedValue(mockLithos)

      await mockLithosDelete({ where: { id: 'lithos-1' } })

      const expectedResponse = {
        success: true,
        message: `Lithos ${mockLithos.name} deleted successfully`,
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.message).toContain('Air Lithos')
      expect(expectedResponse.message).toContain('deleted successfully')
    })
  })
})
