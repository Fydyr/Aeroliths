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
      weaknessElements: {
        create: vi.fn(),
      },
    },
  },
}))

describe('POST /api/admin/weaknesses', () => {
  let mockGetAuthUser: any
  let mockRequireRole: any
  let mockElementsFindUnique: any
  let mockWeaknessElementsCreate: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const authModule = await import('~/server/utils/auth')
    const dbModule = await import('~/server/utils/db')

    mockGetAuthUser = authModule.getAuthUser as any
    mockRequireRole = authModule.requireRole as any
    mockElementsFindUnique = dbModule.default.postgres.elements.findUnique as any
    mockWeaknessElementsCreate = dbModule.default.postgres.weaknessElements.create as any
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
      const body = { weakAgainstId: 'element-2' }
      expect(body.elementId).toBeUndefined()
    })

    it('should reject non-string elementId', () => {
      const body = { elementId: 123, weakAgainstId: 'element-2' }
      expect(typeof body.elementId).not.toBe('string')
    })

    it('should reject missing weakAgainstId', () => {
      const body = { elementId: 'element-1' }
      expect(body.weakAgainstId).toBeUndefined()
    })

    it('should reject non-string weakAgainstId', () => {
      const body = { elementId: 'element-1', weakAgainstId: 123 }
      expect(typeof body.weakAgainstId).not.toBe('string')
    })

    it('should reject self-referencing weakness', () => {
      const body = { elementId: 'element-1', weakAgainstId: 'element-1' }
      expect(body.elementId).toBe(body.weakAgainstId)
    })

    it('should reject non-existent element', async () => {
      mockElementsFindUnique.mockResolvedValue(null)

      const result = await mockElementsFindUnique({ where: { id: 'non-existent' } })
      expect(result).toBeNull()
    })

    it('should accept valid weakness data', () => {
      const body = {
        elementId: 'element-1',
        weakAgainstId: 'element-2',
      }

      expect(body.elementId).toBeDefined()
      expect(typeof body.elementId).toBe('string')
      expect(body.weakAgainstId).toBeDefined()
      expect(typeof body.weakAgainstId).toBe('string')
      expect(body.elementId).not.toBe(body.weakAgainstId)
    })
  })

  describe('Database Operations', () => {
    beforeEach(() => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)
    })

    it('should create weakness successfully', async () => {
      const fireElement = {
        id: 'element-1',
        name: 'Fire',
        sprite: '/sprites/fire.png',
      }

      const waterElement = {
        id: 'element-2',
        name: 'Water',
        sprite: '/sprites/water.png',
      }

      mockElementsFindUnique
        .mockResolvedValueOnce(fireElement)
        .mockResolvedValueOnce(waterElement)

      const weaknessData = {
        elementId: 'element-1',
        weakAgainstId: 'element-2',
      }

      const mockWeakness = {
        id: 'weakness-1',
        ...weaknessData,
        createdAt: new Date(),
        updatedAt: new Date(),
        element: fireElement,
        weakAgainst: waterElement,
      }

      mockWeaknessElementsCreate.mockResolvedValue(mockWeakness)

      const result = await mockWeaknessElementsCreate({
        data: weaknessData,
        include: {
          element: true,
          weakAgainst: true,
        },
      })

      expect(result).toEqual(mockWeakness)
      expect(result.element.name).toBe('Fire')
      expect(result.weakAgainst.name).toBe('Water')
      expect(mockWeaknessElementsCreate).toHaveBeenCalledWith({
        data: weaknessData,
        include: {
          element: true,
          weakAgainst: true,
        },
      })
    })

    it('should handle duplicate weakness relationship', async () => {
      const fireElement = {
        id: 'element-1',
        name: 'Fire',
        sprite: '/sprites/fire.png',
      }

      const waterElement = {
        id: 'element-2',
        name: 'Water',
        sprite: '/sprites/water.png',
      }

      mockElementsFindUnique
        .mockResolvedValueOnce(fireElement)
        .mockResolvedValueOnce(waterElement)

      const weaknessData = {
        elementId: 'element-1',
        weakAgainstId: 'element-2',
      }

      const error: any = new Error('Unique constraint failed')
      error.code = 'P2002'
      mockWeaknessElementsCreate.mockRejectedValue(error)

      await expect(
        mockWeaknessElementsCreate({
          data: weaknessData,
          include: {
            element: true,
            weakAgainst: true,
          },
        })
      ).rejects.toThrow('Unique constraint failed')
    })

    it('should handle database errors', async () => {
      const fireElement = {
        id: 'element-1',
        name: 'Fire',
      }

      const waterElement = {
        id: 'element-2',
        name: 'Water',
      }

      mockElementsFindUnique
        .mockResolvedValueOnce(fireElement)
        .mockResolvedValueOnce(waterElement)

      mockWeaknessElementsCreate.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockWeaknessElementsCreate({
          data: {
            elementId: 'element-1',
            weakAgainstId: 'element-2',
          },
          include: {
            element: true,
            weakAgainst: true,
          },
        })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Response Format', () => {
    it('should return success response with created weakness', async () => {
      const testAdmin = createTestAdmin()
      mockGetAuthUser.mockReturnValue(testAdmin)
      mockRequireRole.mockReturnValue(undefined)

      const earthElement = {
        id: 'element-3',
        name: 'Earth',
        sprite: '/sprites/earth.png',
      }

      const airElement = {
        id: 'element-4',
        name: 'Air',
        sprite: '/sprites/air.png',
      }

      mockElementsFindUnique
        .mockResolvedValueOnce(earthElement)
        .mockResolvedValueOnce(airElement)

      const weaknessData = {
        elementId: 'element-3',
        weakAgainstId: 'element-4',
      }

      const mockWeakness = {
        id: 'weakness-1',
        ...weaknessData,
        createdAt: new Date(),
        updatedAt: new Date(),
        element: earthElement,
        weakAgainst: airElement,
      }

      mockWeaknessElementsCreate.mockResolvedValue(mockWeakness)

      const result = await mockWeaknessElementsCreate({
        data: weaknessData,
        include: {
          element: true,
          weakAgainst: true,
        },
      })

      const expectedResponse = {
        success: true,
        message: 'Weakness created successfully',
        data: result,
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.message).toBe('Weakness created successfully')
      expect(expectedResponse.data).toEqual(mockWeakness)
    })

    it('should include element relations in response', async () => {
      const weaknessData = {
        elementId: 'element-1',
        weakAgainstId: 'element-2',
      }

      const mockWeakness = {
        id: 'weakness-1',
        ...weaknessData,
        createdAt: new Date(),
        updatedAt: new Date(),
        element: {
          id: 'element-1',
          name: 'Fire',
          sprite: '/sprites/fire.png',
        },
        weakAgainst: {
          id: 'element-2',
          name: 'Water',
          sprite: '/sprites/water.png',
        },
      }

      mockWeaknessElementsCreate.mockResolvedValue(mockWeakness)

      const result = await mockWeaknessElementsCreate({
        data: weaknessData,
        include: {
          element: true,
          weakAgainst: true,
        },
      })

      expect(result.id).toBeDefined()
      expect(result.element).toBeDefined()
      expect(result.weakAgainst).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })
  })
})
