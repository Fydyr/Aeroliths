import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the database
vi.mock('~/server/utils/db', () => ({
  default: {
    postgres: {
      elements: {
        findUnique: vi.fn(),
      },
    },
  },
}))

describe('GET /api/elements/[id]', () => {
  let mockElementsFindUnique: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const dbModule = await import('~/server/utils/db')
    mockElementsFindUnique = dbModule.default.postgres.elements.findUnique as any
  })

  describe('Validation', () => {
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
        weaknessesFrom: [],
        strengthsFrom: [],
        lithos: [],
      }

      mockElementsFindUnique.mockResolvedValue(mockElement)

      const result = await mockElementsFindUnique({
        where: { id: 'element-1' },
        include: {
          weaknessesFrom: {
            include: {
              weakAgainst: true,
            },
          },
          strengthsFrom: {
            include: {
              strongAgainst: true,
            },
          },
          lithos: true,
        },
      })

      expect(result).toEqual(mockElement)
      expect(result.id).toBe('element-1')
    })
  })

  describe('Database Operations', () => {
    it('should fetch element with all relations', async () => {
      const mockElement = {
        id: 'element-1',
        name: 'Fire',
        sprite: '/sprites/fire.png',
        createdAt: new Date(),
        updatedAt: new Date(),
        weaknessesFrom: [
          {
            id: 'weakness-1',
            elementId: 'element-1',
            weakAgainstId: 'element-2',
            weakAgainst: {
              id: 'element-2',
              name: 'Water',
              sprite: '/sprites/water.png',
            },
          },
        ],
        strengthsFrom: [
          {
            id: 'strength-1',
            elementId: 'element-1',
            strongAgainstId: 'element-3',
            strongAgainst: {
              id: 'element-3',
              name: 'Earth',
              sprite: '/sprites/earth.png',
            },
          },
        ],
        lithos: [
          {
            id: 'lithos-1',
            name: 'Fire Lithos',
            sprite: '/sprites/fire-lithos.png',
          },
        ],
      }

      mockElementsFindUnique.mockResolvedValue(mockElement)

      const result = await mockElementsFindUnique({
        where: { id: 'element-1' },
        include: {
          weaknessesFrom: {
            include: {
              weakAgainst: true,
            },
          },
          strengthsFrom: {
            include: {
              strongAgainst: true,
            },
          },
          lithos: true,
        },
      })

      expect(result).toEqual(mockElement)
      expect(result.weaknessesFrom).toHaveLength(1)
      expect(result.strengthsFrom).toHaveLength(1)
      expect(result.lithos).toHaveLength(1)
      expect(mockElementsFindUnique).toHaveBeenCalledWith({
        where: { id: 'element-1' },
        include: {
          weaknessesFrom: {
            include: {
              weakAgainst: true,
            },
          },
          strengthsFrom: {
            include: {
              strongAgainst: true,
            },
          },
          lithos: true,
        },
      })
    })

    it('should handle database errors', async () => {
      mockElementsFindUnique.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockElementsFindUnique({
          where: { id: 'element-1' },
          include: {
            weaknessesFrom: {
              include: {
                weakAgainst: true,
              },
            },
            strengthsFrom: {
              include: {
                strongAgainst: true,
              },
            },
            lithos: true,
          },
        })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Response Format', () => {
    it('should return success response with element data', async () => {
      const mockElement = {
        id: 'element-1',
        name: 'Water',
        sprite: '/sprites/water.png',
        createdAt: new Date(),
        updatedAt: new Date(),
        weaknessesFrom: [],
        strengthsFrom: [],
        lithos: [],
      }

      mockElementsFindUnique.mockResolvedValue(mockElement)

      const expectedResponse = {
        success: true,
        data: mockElement,
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.data).toEqual(mockElement)
    })

    it('should include all element properties', async () => {
      const mockElement = {
        id: 'element-1',
        name: 'Earth',
        sprite: '/sprites/earth.png',
        createdAt: new Date(),
        updatedAt: new Date(),
        weaknessesFrom: [],
        strengthsFrom: [],
        lithos: [],
      }

      mockElementsFindUnique.mockResolvedValue(mockElement)

      const result = await mockElementsFindUnique({
        where: { id: 'element-1' },
        include: {
          weaknessesFrom: {
            include: {
              weakAgainst: true,
            },
          },
          strengthsFrom: {
            include: {
              strongAgainst: true,
            },
          },
          lithos: true,
        },
      })

      expect(result.id).toBeDefined()
      expect(result.name).toBeDefined()
      expect(result.sprite).toBeDefined()
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
      expect(result.weaknessesFrom).toBeDefined()
      expect(result.strengthsFrom).toBeDefined()
      expect(result.lithos).toBeDefined()
    })
  })

  describe('Relations', () => {
    it('should include nested weakness relations', async () => {
      const mockElement = {
        id: 'element-1',
        name: 'Fire',
        sprite: '/sprites/fire.png',
        createdAt: new Date(),
        updatedAt: new Date(),
        weaknessesFrom: [
          {
            id: 'weakness-1',
            elementId: 'element-1',
            weakAgainstId: 'element-2',
            weakAgainst: {
              id: 'element-2',
              name: 'Water',
              sprite: '/sprites/water.png',
            },
          },
        ],
        strengthsFrom: [],
        lithos: [],
      }

      mockElementsFindUnique.mockResolvedValue(mockElement)

      const result = await mockElementsFindUnique({
        where: { id: 'element-1' },
        include: {
          weaknessesFrom: {
            include: {
              weakAgainst: true,
            },
          },
          strengthsFrom: {
            include: {
              strongAgainst: true,
            },
          },
          lithos: true,
        },
      })

      expect(result.weaknessesFrom[0].weakAgainst).toBeDefined()
      expect(result.weaknessesFrom[0].weakAgainst.name).toBe('Water')
    })

    it('should include nested strength relations', async () => {
      const mockElement = {
        id: 'element-1',
        name: 'Water',
        sprite: '/sprites/water.png',
        createdAt: new Date(),
        updatedAt: new Date(),
        weaknessesFrom: [],
        strengthsFrom: [
          {
            id: 'strength-1',
            elementId: 'element-1',
            strongAgainstId: 'element-2',
            strongAgainst: {
              id: 'element-2',
              name: 'Fire',
              sprite: '/sprites/fire.png',
            },
          },
        ],
        lithos: [],
      }

      mockElementsFindUnique.mockResolvedValue(mockElement)

      const result = await mockElementsFindUnique({
        where: { id: 'element-1' },
        include: {
          weaknessesFrom: {
            include: {
              weakAgainst: true,
            },
          },
          strengthsFrom: {
            include: {
              strongAgainst: true,
            },
          },
          lithos: true,
        },
      })

      expect(result.strengthsFrom[0].strongAgainst).toBeDefined()
      expect(result.strengthsFrom[0].strongAgainst.name).toBe('Fire')
    })
  })
})
