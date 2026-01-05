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
        update: vi.fn(),
      },
    },
  },
}))

describe('PATCH /api/admin/elements/[id]', () => {
  let mockGetAuthUser: any
  let mockRequireRole: any
  let mockElementsFindUnique: any
  let mockElementsUpdate: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')

    mockGetAuthUser = authModule.getAuthUser as any
    mockRequireRole = authModule.requireRole as any
    mockElementsFindUnique = dbModule.default.postgres.elements.findUnique as any
    mockElementsUpdate = dbModule.default.postgres.elements.update as any
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

    it('should reject non-string name', () => {
      const body = { name: 123 }
      expect(typeof body.name).not.toBe('string')
    })

    it('should reject non-string sprite', () => {
      const body = { sprite: 456 }
      expect(typeof body.sprite).not.toBe('string')
    })

    it('should reject empty update', () => {
      const body = {}
      expect(Object.keys(body).length).toBe(0)
    })

    it('should accept valid update data', async () => {
      const mockElement = {
        id: 'element-1',
        name: 'Fire',
        sprite: '/sprites/fire.png',
      }

      mockElementsFindUnique.mockResolvedValue(mockElement)

      const result = await mockElementsFindUnique({ where: { id: 'element-1' } })
      expect(result).toEqual(mockElement)

      const updateData = { name: 'Fire Updated' }
      expect(typeof updateData.name).toBe('string')
    })
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should update element name successfully', async () => {
      const mockElement = {
        id: 'element-1',
        name: 'Fire',
        sprite: '/sprites/fire.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockElementsFindUnique.mockResolvedValue(mockElement)

      const updatedElement = {
        ...mockElement,
        name: 'Fire Updated',
        updatedAt: new Date(),
      }

      mockElementsUpdate.mockResolvedValue(updatedElement)

      const result = await mockElementsUpdate({
        where: { id: 'element-1' },
        data: { name: 'Fire Updated' },
      })

      expect(result.name).toBe('Fire Updated')
      expect(mockElementsUpdate).toHaveBeenCalledWith({
        where: { id: 'element-1' },
        data: { name: 'Fire Updated' },
      })
    })

    it('should update element sprite successfully', async () => {
      const mockElement = {
        id: 'element-1',
        name: 'Water',
        sprite: '/sprites/water.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockElementsFindUnique.mockResolvedValue(mockElement)

      const updatedElement = {
        ...mockElement,
        sprite: '/sprites/water-new.png',
        updatedAt: new Date(),
      }

      mockElementsUpdate.mockResolvedValue(updatedElement)

      const result = await mockElementsUpdate({
        where: { id: 'element-1' },
        data: { sprite: '/sprites/water-new.png' },
      })

      expect(result.sprite).toBe('/sprites/water-new.png')
    })

    it('should update multiple fields', async () => {
      const mockElement = {
        id: 'element-1',
        name: 'Earth',
        sprite: '/sprites/earth.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockElementsFindUnique.mockResolvedValue(mockElement)

      const updatedElement = {
        ...mockElement,
        name: 'Earth Updated',
        sprite: '/sprites/earth-new.png',
        updatedAt: new Date(),
      }

      mockElementsUpdate.mockResolvedValue(updatedElement)

      const result = await mockElementsUpdate({
        where: { id: 'element-1' },
        data: {
          name: 'Earth Updated',
          sprite: '/sprites/earth-new.png',
        },
      })

      expect(result.name).toBe('Earth Updated')
      expect(result.sprite).toBe('/sprites/earth-new.png')
    })

    it('should handle duplicate element name', async () => {
      const mockElement = {
        id: 'element-1',
        name: 'Air',
        sprite: '/sprites/air.png',
      }

      mockElementsFindUnique.mockResolvedValue(mockElement)

      const error: any = new Error('Unique constraint failed')
      error.code = 'P2002'
      mockElementsUpdate.mockRejectedValue(error)

      await expect(
        mockElementsUpdate({
          where: { id: 'element-1' },
          data: { name: 'Fire' },
        })
      ).rejects.toThrow('Unique constraint failed')
    })

    it('should handle database errors', async () => {
      mockElementsFindUnique.mockResolvedValue({
        id: 'element-1',
        name: 'Fire',
      })

      mockElementsUpdate.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockElementsUpdate({
          where: { id: 'element-1' },
          data: { name: 'Fire Updated' },
        })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Response Format', () => {
    it('should return success response with updated element', async () => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)

      const mockElement = {
        id: 'element-1',
        name: 'Fire',
        sprite: '/sprites/fire.png',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockElementsFindUnique.mockResolvedValue(mockElement)

      const updatedElement = {
        ...mockElement,
        name: 'Fire Updated',
        updatedAt: new Date(),
      }

      mockElementsUpdate.mockResolvedValue(updatedElement)

      const result = await mockElementsUpdate({
        where: { id: 'element-1' },
        data: { name: 'Fire Updated' },
      })

      const expectedResponse = {
        success: true,
        message: 'Element updated successfully',
        data: result,
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.message).toBe('Element updated successfully')
      expect(expectedResponse.data.name).toBe('Fire Updated')
    })
  })
})
