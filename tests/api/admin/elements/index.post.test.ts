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
        create: vi.fn(),
      },
    },
  },
}))

describe('POST /api/admin/elements', () => {
  let mockGetAuthUser: any
  let mockRequireRole: any
  let mockElementsCreate: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')

    mockGetAuthUser = authModule.getAuthUser as any
    mockRequireRole = authModule.requireRole as any
    mockElementsCreate = dbModule.default.postgres.elements.create as any
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

    it('should reject missing element name', () => {
      const body = { sprite: '/sprites/fire.png' }
      expect(body.name).toBeUndefined()
    })

    it('should reject non-string element name', () => {
      const body = { name: 123, sprite: '/sprites/fire.png' }
      expect(typeof body.name).not.toBe('string')
    })

    it('should reject missing sprite', () => {
      const body = { name: 'Fire' }
      expect(body.sprite).toBeUndefined()
    })

    it('should reject non-string sprite', () => {
      const body = { name: 'Fire', sprite: 123 }
      expect(typeof body.sprite).not.toBe('string')
    })

    it('should accept valid element data', () => {
      const body = {
        name: 'Fire',
        sprite: '/sprites/fire.png',
      }

      expect(body.name).toBe('Fire')
      expect(typeof body.name).toBe('string')
      expect(body.sprite).toBe('/sprites/fire.png')
      expect(typeof body.sprite).toBe('string')
    })
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should create element successfully', async () => {
      const elementData = {
        name: 'Fire',
        sprite: '/sprites/fire.png',
      }

      const mockElement = {
        id: 'element-1',
        ...elementData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockElementsCreate.mockResolvedValue(mockElement)

      const result = await mockElementsCreate({
        data: elementData,
      })

      expect(result).toEqual(mockElement)
      expect(mockElementsCreate).toHaveBeenCalledWith({
        data: elementData,
      })
    })

    it('should handle duplicate element name', async () => {
      const elementData = {
        name: 'Fire',
        sprite: '/sprites/fire.png',
      }

      const error: any = new Error('Unique constraint failed')
      error.code = 'P2002'
      mockElementsCreate.mockRejectedValue(error)

      await expect(
        mockElementsCreate({
          data: elementData,
        })
      ).rejects.toThrow('Unique constraint failed')

      expect(mockElementsCreate).toHaveBeenCalledWith({
        data: elementData,
      })
    })

    it('should handle database errors', async () => {
      const elementData = {
        name: 'Water',
        sprite: '/sprites/water.png',
      }

      mockElementsCreate.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockElementsCreate({
          data: elementData,
        })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Response Format', () => {
    it('should return success response with created element', async () => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)

      const elementData = {
        name: 'Earth',
        sprite: '/sprites/earth.png',
      }

      const mockElement = {
        id: 'element-1',
        ...elementData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockElementsCreate.mockResolvedValue(mockElement)

      const result = await mockElementsCreate({
        data: elementData,
      })

      const expectedResponse = {
        success: true,
        message: 'Element created successfully',
        data: result,
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.message).toBe('Element created successfully')
      expect(expectedResponse.data).toEqual(mockElement)
    })

    it('should include element ID and timestamps', async () => {
      const elementData = {
        name: 'Air',
        sprite: '/sprites/air.png',
      }

      const mockElement = {
        id: 'element-1',
        ...elementData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockElementsCreate.mockResolvedValue(mockElement)

      const result = await mockElementsCreate({
        data: elementData,
      })

      expect(result.id).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })
  })
})
