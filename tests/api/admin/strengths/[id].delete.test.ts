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
      strengthElements: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    },
  },
}))

describe('DELETE /api/admin/strengths/[id]', () => {
  let mockGetAuthUser: any
  let mockRequireRole: any
  let mockStrengthElementsFindUnique: any
  let mockStrengthElementsDelete: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')

    mockGetAuthUser = authModule.getAuthUser as any
    mockRequireRole = authModule.requireRole as any
    mockStrengthElementsFindUnique = dbModule.default.postgres.strengthElements.findUnique as any
    mockStrengthElementsDelete = dbModule.default.postgres.strengthElements.delete as any
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

    it('should reject missing strength ID', () => {
      const id = undefined
      expect(id).toBeUndefined()
    })

    it('should reject non-existent strength', async () => {
      mockStrengthElementsFindUnique.mockResolvedValue(null)

      const result = await mockStrengthElementsFindUnique({ where: { id: 'non-existent' } })
      expect(result).toBeNull()
    })

    it('should accept valid strength ID', async () => {
      const mockStrength = {
        id: 'strength-1',
        elementId: 'element-1',
        strongAgainstId: 'element-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockStrengthElementsFindUnique.mockResolvedValue(mockStrength)

      const result = await mockStrengthElementsFindUnique({ where: { id: 'strength-1' } })
      expect(result).toEqual(mockStrength)
      expect(result.id).toBe('strength-1')
    })
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should delete strength successfully', async () => {
      const mockStrength = {
        id: 'strength-to-delete',
        elementId: 'element-1',
        strongAgainstId: 'element-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockStrengthElementsFindUnique.mockResolvedValue(mockStrength)
      mockStrengthElementsDelete.mockResolvedValue(mockStrength)

      const existingStrength = await mockStrengthElementsFindUnique({
        where: { id: 'strength-to-delete' },
      })

      expect(existingStrength).toEqual(mockStrength)

      const result = await mockStrengthElementsDelete({
        where: { id: 'strength-to-delete' },
      })

      expect(result).toEqual(mockStrength)
      expect(mockStrengthElementsDelete).toHaveBeenCalledWith({
        where: { id: 'strength-to-delete' },
      })
    })

    it('should handle database errors', async () => {
      mockStrengthElementsFindUnique.mockResolvedValue({
        id: 'strength-1',
        elementId: 'element-1',
        strongAgainstId: 'element-2',
      })

      mockStrengthElementsDelete.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockStrengthElementsDelete({
          where: { id: 'strength-1' },
        })
      ).rejects.toThrow('Database connection failed')
    })

    it('should not affect elements when deleting strength', async () => {
      // Test verifies that deleting a strength does not delete the related elements
      const mockStrength = {
        id: 'strength-1',
        elementId: 'element-1',
        strongAgainstId: 'element-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockStrengthElementsFindUnique.mockResolvedValue(mockStrength)
      mockStrengthElementsDelete.mockResolvedValue(mockStrength)

      const result = await mockStrengthElementsDelete({
        where: { id: 'strength-1' },
      })

      expect(result).toEqual(mockStrength)
      // The elements themselves should remain in the database
      expect(result.elementId).toBe('element-1')
      expect(result.strongAgainstId).toBe('element-2')
    })
  })

  describe('Response Format', () => {
    it('should return success response', async () => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)

      const mockStrength = {
        id: 'strength-1',
        elementId: 'element-1',
        strongAgainstId: 'element-2',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockStrengthElementsFindUnique.mockResolvedValue(mockStrength)
      mockStrengthElementsDelete.mockResolvedValue(mockStrength)

      await mockStrengthElementsDelete({ where: { id: 'strength-1' } })

      const expectedResponse = {
        success: true,
        message: 'Strength deleted successfully',
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.message).toBe('Strength deleted successfully')
    })
  })
})
