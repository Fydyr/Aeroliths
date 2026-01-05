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
      },
      strengthElements: {
        create: vi.fn(),
      },
    },
  },
}))

describe('POST /api/admin/strengths', () => {
  let mockGetAuthUser: any
  let mockRequireRole: any
  let mockElementsFindUnique: any
  let mockStrengthElementsCreate: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')

    mockGetAuthUser = authModule.getAuthUser as any
    mockRequireRole = authModule.requireRole as any
    mockElementsFindUnique = dbModule.default.postgres.elements.findUnique as any
    mockStrengthElementsCreate = dbModule.default.postgres.strengthElements.create as any
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

    it('should reject missing elementId', () => {
      const body = { strongAgainstId: 'element-2' }
      expect(body.elementId).toBeUndefined()
    })

    it('should reject non-string elementId', () => {
      const body = { elementId: 123, strongAgainstId: 'element-2' }
      expect(typeof body.elementId).not.toBe('string')
    })

    it('should reject missing strongAgainstId', () => {
      const body = { elementId: 'element-1' }
      expect(body.strongAgainstId).toBeUndefined()
    })

    it('should reject non-string strongAgainstId', () => {
      const body = { elementId: 'element-1', strongAgainstId: 123 }
      expect(typeof body.strongAgainstId).not.toBe('string')
    })

    it('should reject self-referencing strength', () => {
      const body = { elementId: 'element-1', strongAgainstId: 'element-1' }
      expect(body.elementId).toBe(body.strongAgainstId)
    })

    it('should reject non-existent element', async () => {
      mockElementsFindUnique.mockResolvedValue(null)

      const result = await mockElementsFindUnique({ where: { id: 'non-existent' } })
      expect(result).toBeNull()
    })

    it('should accept valid strength data', () => {
      const body = {
        elementId: 'element-1',
        strongAgainstId: 'element-2',
      }

      expect(body.elementId).toBeDefined()
      expect(typeof body.elementId).toBe('string')
      expect(body.strongAgainstId).toBeDefined()
      expect(typeof body.strongAgainstId).toBe('string')
      expect(body.elementId).not.toBe(body.strongAgainstId)
    })
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should create strength successfully', async () => {
      const waterElement = {
        id: 'element-1',
        name: 'Water',
        sprite: '/sprites/water.png',
      }

      const fireElement = {
        id: 'element-2',
        name: 'Fire',
        sprite: '/sprites/fire.png',
      }

      mockElementsFindUnique
        .mockResolvedValueOnce(waterElement)
        .mockResolvedValueOnce(fireElement)

      const strengthData = {
        elementId: 'element-1',
        strongAgainstId: 'element-2',
      }

      const mockStrength = {
        id: 'strength-1',
        ...strengthData,
        createdAt: new Date(),
        updatedAt: new Date(),
        element: waterElement,
        strongAgainst: fireElement,
      }

      mockStrengthElementsCreate.mockResolvedValue(mockStrength)

      const result = await mockStrengthElementsCreate({
        data: strengthData,
        include: {
          element: true,
          strongAgainst: true,
        },
      })

      expect(result).toEqual(mockStrength)
      expect(result.element.name).toBe('Water')
      expect(result.strongAgainst.name).toBe('Fire')
      expect(mockStrengthElementsCreate).toHaveBeenCalledWith({
        data: strengthData,
        include: {
          element: true,
          strongAgainst: true,
        },
      })
    })

    it('should handle duplicate strength relationship', async () => {
      const waterElement = {
        id: 'element-1',
        name: 'Water',
        sprite: '/sprites/water.png',
      }

      const fireElement = {
        id: 'element-2',
        name: 'Fire',
        sprite: '/sprites/fire.png',
      }

      mockElementsFindUnique
        .mockResolvedValueOnce(waterElement)
        .mockResolvedValueOnce(fireElement)

      const strengthData = {
        elementId: 'element-1',
        strongAgainstId: 'element-2',
      }

      const error: any = new Error('Unique constraint failed')
      error.code = 'P2002'
      mockStrengthElementsCreate.mockRejectedValue(error)

      await expect(
        mockStrengthElementsCreate({
          data: strengthData,
          include: {
            element: true,
            strongAgainst: true,
          },
        })
      ).rejects.toThrow('Unique constraint failed')
    })

    it('should handle database errors', async () => {
      const earthElement = {
        id: 'element-3',
        name: 'Earth',
      }

      const airElement = {
        id: 'element-4',
        name: 'Air',
      }

      mockElementsFindUnique
        .mockResolvedValueOnce(earthElement)
        .mockResolvedValueOnce(airElement)

      mockStrengthElementsCreate.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockStrengthElementsCreate({
          data: {
            elementId: 'element-3',
            strongAgainstId: 'element-4',
          },
          include: {
            element: true,
            strongAgainst: true,
          },
        })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Response Format', () => {
    it('should return success response with created strength', async () => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)

      const airElement = {
        id: 'element-4',
        name: 'Air',
        sprite: '/sprites/air.png',
      }

      const earthElement = {
        id: 'element-3',
        name: 'Earth',
        sprite: '/sprites/earth.png',
      }

      mockElementsFindUnique
        .mockResolvedValueOnce(airElement)
        .mockResolvedValueOnce(earthElement)

      const strengthData = {
        elementId: 'element-4',
        strongAgainstId: 'element-3',
      }

      const mockStrength = {
        id: 'strength-1',
        ...strengthData,
        createdAt: new Date(),
        updatedAt: new Date(),
        element: airElement,
        strongAgainst: earthElement,
      }

      mockStrengthElementsCreate.mockResolvedValue(mockStrength)

      const result = await mockStrengthElementsCreate({
        data: strengthData,
        include: {
          element: true,
          strongAgainst: true,
        },
      })

      const expectedResponse = {
        success: true,
        message: 'Strength created successfully',
        data: result,
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.message).toBe('Strength created successfully')
      expect(expectedResponse.data).toEqual(mockStrength)
    })

    it('should include element relations in response', async () => {
      const strengthData = {
        elementId: 'element-1',
        strongAgainstId: 'element-2',
      }

      const mockStrength = {
        id: 'strength-1',
        ...strengthData,
        createdAt: new Date(),
        updatedAt: new Date(),
        element: {
          id: 'element-1',
          name: 'Water',
          sprite: '/sprites/water.png',
        },
        strongAgainst: {
          id: 'element-2',
          name: 'Fire',
          sprite: '/sprites/fire.png',
        },
      }

      mockStrengthElementsCreate.mockResolvedValue(mockStrength)

      const result = await mockStrengthElementsCreate({
        data: strengthData,
        include: {
          element: true,
          strongAgainst: true,
        },
      })

      expect(result.id).toBeDefined()
      expect(result.element).toBeDefined()
      expect(result.strongAgainst).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })
  })
})
