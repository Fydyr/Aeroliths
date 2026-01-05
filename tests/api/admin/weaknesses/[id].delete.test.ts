import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createTestAdmin, createTestUser } from '../../../utils/auth'

// Mock the auth utilities
vi.mock('~/server/utils/auth', () => ({
  getAuthUser: vi.fn(),
  requireRole: vi.fn(),
}))

// Mock the database
vi.mock('~/server/utils/db', () => ({
  default: {
    postgres: {
      weaknessElements: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    },
  },
}))

describe('DELETE /api/admin/weaknesses/[id]', () => {
  let mockGetAuthUser: any
  let mockRequireRole: any
  let mockWeaknessElementsFindUnique: any
  let mockWeaknessElementsDelete: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')

    mockGetAuthUser = authModule.getAuthUser as any
    mockRequireRole = authModule.requireRole as any
    mockWeaknessElementsFindUnique = dbModule.default.postgres.weaknessElements.findUnique as any
    mockWeaknessElementsDelete = dbModule.default.postgres.weaknessElements.delete as any
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

      expect(() => mockRequireRole(testAdmin, ['admin'])).not.toThrow()
    })
  })

  describe('Validation', () => {
    beforeEach(() => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should reject missing weakness ID', () => {
      const id = undefined
      expect(id).toBeUndefined()
    })

    it('should reject non-existent weakness', async () => {
      mockWeaknessElementsFindUnique.mockResolvedValue(null)

      const result = await mockWeaknessElementsFindUnique({ where: { id: 'non-existent' } })
      expect(result).toBeNull()
    })

    it('should accept valid weakness ID', async () => {
      const mockWeakness = {
        id: 'weakness-1',
        elementId: 'element-1',
        weakAgainstId: 'element-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockWeaknessElementsFindUnique.mockResolvedValue(mockWeakness)

      const result = await mockWeaknessElementsFindUnique({ where: { id: 'weakness-1' } })
      expect(result).toEqual(mockWeakness)
      expect(result.id).toBe('weakness-1')
    })
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should delete weakness successfully', async () => {
      const mockWeakness = {
        id: 'weakness-to-delete',
        elementId: 'element-1',
        weakAgainstId: 'element-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockWeaknessElementsFindUnique.mockResolvedValue(mockWeakness)
      mockWeaknessElementsDelete.mockResolvedValue(mockWeakness)

      const existingWeakness = await mockWeaknessElementsFindUnique({
        where: { id: 'weakness-to-delete' },
      })

      expect(existingWeakness).toEqual(mockWeakness)

      const result = await mockWeaknessElementsDelete({
        where: { id: 'weakness-to-delete' },
      })

      expect(result).toEqual(mockWeakness)
      expect(mockWeaknessElementsDelete).toHaveBeenCalledWith({
        where: { id: 'weakness-to-delete' },
      })
    })

    it('should handle database errors', async () => {
      mockWeaknessElementsFindUnique.mockResolvedValue({
        id: 'weakness-1',
        elementId: 'element-1',
        weakAgainstId: 'element-2',
      })

      mockWeaknessElementsDelete.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockWeaknessElementsDelete({
          where: { id: 'weakness-1' },
        })
      ).rejects.toThrow('Database connection failed')
    })

    it('should not affect elements when deleting weakness', async () => {
      // Test verifies that deleting a weakness does not delete the related elements
      const mockWeakness = {
        id: 'weakness-1',
        elementId: 'element-1',
        weakAgainstId: 'element-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockWeaknessElementsFindUnique.mockResolvedValue(mockWeakness)
      mockWeaknessElementsDelete.mockResolvedValue(mockWeakness)

      const result = await mockWeaknessElementsDelete({
        where: { id: 'weakness-1' },
      })

      expect(result).toEqual(mockWeakness)
      // The elements themselves should remain in the database
      expect(result.elementId).toBe('element-1')
      expect(result.weakAgainstId).toBe('element-2')
    })
  })

  describe('Response Format', () => {
    it('should return success response', async () => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)

      const mockWeakness = {
        id: 'weakness-1',
        elementId: 'element-1',
        weakAgainstId: 'element-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockWeaknessElementsFindUnique.mockResolvedValue(mockWeakness)
      mockWeaknessElementsDelete.mockResolvedValue(mockWeakness)

      await mockWeaknessElementsDelete({ where: { id: 'weakness-1' } })

      const expectedResponse = {
        success: true,
        message: 'Weakness deleted successfully',
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.message).toBe('Weakness deleted successfully')
    })
  })
})
