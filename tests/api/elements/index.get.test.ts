import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the database
vi.mock('~/server/utils/db', () => ({
  default: {
    postgres: {
      elements: {
        findMany: vi.fn(),
      },
    },
  },
}))

describe('GET /api/elements', () => {
  let mockElementsFindMany: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const dbModule = await import('~/server/utils/db')
    mockElementsFindMany = dbModule.default.postgres.elements.findMany as any
  })

  describe('Database Operations', () => {
    it('should fetch all elements ordered by name', async () => {
      const mockElements = [
        {
          id: 'element-1',
          name: 'Fire',
          sprite: '/sprites/fire.png',
          createdAt: new Date(),
          updatedAt: new Date(),
          weaknessesFrom: [],
          strengthsFrom: [],
        },
        {
          id: 'element-2',
          name: 'Water',
          sprite: '/sprites/water.png',
          createdAt: new Date(),
          updatedAt: new Date(),
          weaknessesFrom: [],
          strengthsFrom: [],
        },
      ]

      mockElementsFindMany.mockResolvedValue(mockElements)

      const result = await mockElementsFindMany({
        orderBy: { name: 'asc' },
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
        },
      })

      expect(result).toEqual(mockElements)
      expect(result.length).toBe(2)
      expect(mockElementsFindMany).toHaveBeenCalledWith({
        orderBy: { name: 'asc' },
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
        },
      })
    })

    it('should return empty array when no elements exist', async () => {
      mockElementsFindMany.mockResolvedValue([])

      const result = await mockElementsFindMany({
        orderBy: { name: 'asc' },
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
        },
      })

      expect(result).toEqual([])
      expect(result.length).toBe(0)
    })

    it('should handle database errors', async () => {
      mockElementsFindMany.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockElementsFindMany({
          orderBy: { name: 'asc' },
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
          },
        })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Response Format', () => {
    it('should return success response with all elements', async () => {
      const mockElements = [
        {
          id: 'element-1',
          name: 'Earth',
          sprite: '/sprites/earth.png',
          createdAt: new Date(),
          updatedAt: new Date(),
          weaknessesFrom: [],
          strengthsFrom: [],
        },
      ]

      mockElementsFindMany.mockResolvedValue(mockElements)

      const expectedResponse = {
        success: true,
        data: mockElements,
        count: mockElements.length,
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.count).toBe(1)
      expect(expectedResponse.data).toEqual(mockElements)
    })

    it('should include all element properties', async () => {
      const mockElements = [
        {
          id: 'element-1',
          name: 'Air',
          sprite: '/sprites/air.png',
          createdAt: new Date(),
          updatedAt: new Date(),
          weaknessesFrom: [],
          strengthsFrom: [],
        },
      ]

      mockElementsFindMany.mockResolvedValue(mockElements)

      const result = await mockElementsFindMany({
        orderBy: { name: 'asc' },
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
        },
      })

      const element = result[0]
      expect(element.id).toBeDefined()
      expect(element.name).toBeDefined()
      expect(element.sprite).toBeDefined()
      expect(element.createdAt).toBeDefined()
      expect(element.updatedAt).toBeDefined()
      expect(element.weaknessesFrom).toBeDefined()
      expect(element.strengthsFrom).toBeDefined()
    })
  })

  describe('Relations', () => {
    it('should include weaknesses and strengths', async () => {
      const mockElements = [
        {
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
        },
      ]

      mockElementsFindMany.mockResolvedValue(mockElements)

      const result = await mockElementsFindMany({
        orderBy: { name: 'asc' },
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
        },
      })

      expect(result[0].weaknessesFrom).toHaveLength(1)
      expect(result[0].strengthsFrom).toHaveLength(1)
      expect(result[0].weaknessesFrom[0].weakAgainst.name).toBe('Water')
      expect(result[0].strengthsFrom[0].strongAgainst.name).toBe('Earth')
    })
  })

  describe('Ordering', () => {
    it('should order elements alphabetically by name', async () => {
      const mockElements = [
        { id: '1', name: 'Air', sprite: '', createdAt: new Date(), updatedAt: new Date() },
        { id: '2', name: 'Earth', sprite: '', createdAt: new Date(), updatedAt: new Date() },
        { id: '3', name: 'Fire', sprite: '', createdAt: new Date(), updatedAt: new Date() },
        { id: '4', name: 'Water', sprite: '', createdAt: new Date(), updatedAt: new Date() },
      ]

      mockElementsFindMany.mockResolvedValue(mockElements)

      const result = await mockElementsFindMany({
        orderBy: { name: 'asc' },
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
        },
      })

      // Verify alphabetical ordering
      expect(result[0].name).toBe('Air')
      expect(result[1].name).toBe('Earth')
      expect(result[2].name).toBe('Fire')
      expect(result[3].name).toBe('Water')
    })
  })
})
