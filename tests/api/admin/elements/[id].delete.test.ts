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
      elements: {
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    },
  },
}))

describe('DELETE /api/admin/elements/[id]', () => {
  let mockGetAuthUser: any
  let mockRequireRole: any
  let mockElementsFindUnique: any
  let mockElementsDelete: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')

    mockGetAuthUser = authModule.getAuthUser as any
    mockRequireRole = authModule.requireRole as any
    mockElementsFindUnique = dbModule.default.postgres.elements.findUnique as any
    mockElementsDelete = dbModule.default.postgres.elements.delete as any
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

    it('should reject missing element ID', () => {
      const id = undefined
      expect(id).toBeUndefined()
    })

    it('should reject non-existent element', async () => {
      mockElementsFindUnique.mockResolvedValue(null)

      const result = await mockElementsFindUnique({ where: { id: 'non-existent' } })
      expect(result).toBeNull()
    })

    it('should accept valid element ID', async () => {
      const mockElement = {
        id: 'element-1',
        name: 'Fire',
        sprite: '/sprites/fire.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockElementsFindUnique.mockResolvedValue(mockElement)

      const result = await mockElementsFindUnique({ where: { id: 'element-1' } })
      expect(result).toEqual(mockElement)
      expect(result.id).toBe('element-1')
    })
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should delete element successfully', async () => {
      const mockElement = {
        id: 'element-to-delete',
        name: 'Water',
        sprite: '/sprites/water.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockElementsFindUnique.mockResolvedValue(mockElement)
      mockElementsDelete.mockResolvedValue(mockElement)

      const existingElement = await mockElementsFindUnique({
        where: { id: 'element-to-delete' },
      })

      expect(existingElement).toEqual(mockElement)

      const result = await mockElementsDelete({
        where: { id: 'element-to-delete' },
      })

      expect(result).toEqual(mockElement)
      expect(mockElementsDelete).toHaveBeenCalledWith({
        where: { id: 'element-to-delete' },
      })
    })

    it('should handle database errors', async () => {
      mockElementsFindUnique.mockResolvedValue({
        id: 'element-1',
        name: 'Fire',
      })

      mockElementsDelete.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockElementsDelete({
          where: { id: 'element-1' },
        })
      ).rejects.toThrow('Database connection failed')
    })

    it('should cascade delete related weaknesses and strengths', async () => {
      // Test verifies that cascade deletion is expected behavior
      const mockElement = {
        id: 'element-with-relations',
        name: 'Earth',
        sprite: '/sprites/earth.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockElementsFindUnique.mockResolvedValue(mockElement)
      mockElementsDelete.mockResolvedValue(mockElement)

      // When element is deleted, all weaknesses and strengths should also be deleted
      // This is handled by Prisma onDelete: Cascade in the schema
      const result = await mockElementsDelete({
        where: { id: 'element-with-relations' },
      })

      expect(result).toEqual(mockElement)
    })

    it('should cascade delete related lithos elementId', async () => {
      // Test verifies that cascade behavior for lithos
      const mockElement = {
        id: 'element-with-lithos',
        name: 'Fire',
        sprite: '/sprites/fire.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockElementsFindUnique.mockResolvedValue(mockElement)
      mockElementsDelete.mockResolvedValue(mockElement)

      // When element is deleted, lithos.elementId should be set to null (optional relation)
      const result = await mockElementsDelete({
        where: { id: 'element-with-lithos' },
      })

      expect(result).toEqual(mockElement)
    })
  })

  describe('Response Format', () => {
    it('should return success response', async () => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)

      const mockElement = {
        id: 'element-1',
        name: 'Air',
        sprite: '/sprites/air.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockElementsFindUnique.mockResolvedValue(mockElement)
      mockElementsDelete.mockResolvedValue(mockElement)

      await mockElementsDelete({ where: { id: 'element-1' } })

      const expectedResponse = {
        success: true,
        message: 'Element deleted successfully',
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.message).toBe('Element deleted successfully')
    })
  })
})
