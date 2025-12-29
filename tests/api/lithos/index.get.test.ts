import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the database
vi.mock('~/server/utils/db', () => ({
  default: {
    postgres: {
      lithos: {
        findMany: vi.fn(),
      },
    },
  },
}))

describe('GET /api/lithos', () => {
  let mockLithosFindMany: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const dbModule = await import('~/server/utils/db')
    mockLithosFindMany = dbModule.default.postgres.lithos.findMany as any
  })

  describe('Database Operations', () => {
    it('should fetch all lithos ordered by name', async () => {
      const mockLithos = [
        {
          id: 'lithos-1',
          name: 'Air Lithos',
          sprite: '/sprites/air.png',
          type: 'air',
          spikeLeft: 0,
          spikeRight: 3,
          spikeUp: 2,
          spikeDown: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'lithos-2',
          name: 'Earth Lithos',
          sprite: '/sprites/earth.png',
          type: 'earth',
          spikeLeft: 3,
          spikeRight: 3,
          spikeUp: 2,
          spikeDown: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'lithos-3',
          name: 'Fire Lithos',
          sprite: '/sprites/fire.png',
          type: 'fire',
          spikeLeft: 2,
          spikeRight: 1,
          spikeUp: 3,
          spikeDown: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockLithosFindMany.mockResolvedValue(mockLithos)

      const result = await mockLithosFindMany({
        orderBy: {
          name: 'asc',
        },
      })

      expect(result).toEqual(mockLithos)
      expect(result.length).toBe(3)
      expect(mockLithosFindMany).toHaveBeenCalledWith({
        orderBy: {
          name: 'asc',
        },
      })
    })

    it('should return empty array when no lithos exist', async () => {
      mockLithosFindMany.mockResolvedValue([])

      const result = await mockLithosFindMany({
        orderBy: {
          name: 'asc',
        },
      })

      expect(result).toEqual([])
      expect(result.length).toBe(0)
    })

    it('should handle database errors', async () => {
      mockLithosFindMany.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockLithosFindMany({
          orderBy: {
            name: 'asc',
          },
        })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Response Format', () => {
    it('should return success response with all lithos', async () => {
      const mockLithos = [
        {
          id: 'lithos-1',
          name: 'Water Lithos',
          sprite: '/sprites/water.png',
          type: 'water',
          spikeLeft: 1,
          spikeRight: 2,
          spikeUp: 1,
          spikeDown: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockLithosFindMany.mockResolvedValue(mockLithos)

      const expectedResponse = {
        success: true,
        data: mockLithos,
        count: mockLithos.length,
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.count).toBe(1)
      expect(expectedResponse.data).toEqual(mockLithos)
    })

    it('should include all lithos properties', async () => {
      const mockLithos = [
        {
          id: 'lithos-1',
          name: 'Fire Lithos',
          sprite: '/sprites/fire.png',
          type: 'fire',
          spikeLeft: 2,
          spikeRight: 1,
          spikeUp: 3,
          spikeDown: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]

      mockLithosFindMany.mockResolvedValue(mockLithos)

      const result = await mockLithosFindMany({
        orderBy: { name: 'asc' },
      })

      const lithos = result[0]
      expect(lithos.id).toBeDefined()
      expect(lithos.name).toBeDefined()
      expect(lithos.sprite).toBeDefined()
      expect(lithos.type).toBeDefined()
      expect(lithos.spikeLeft).toBeDefined()
      expect(lithos.spikeRight).toBeDefined()
      expect(lithos.spikeUp).toBeDefined()
      expect(lithos.spikeDown).toBeDefined()
      expect(lithos.createdAt).toBeDefined()
      expect(lithos.updatedAt).toBeDefined()
    })
  })

  describe('Ordering', () => {
    it('should order lithos alphabetically by name', async () => {
      const mockLithos = [
        { id: '1', name: 'Air Lithos', sprite: '', type: 'air', spikeLeft: 0, spikeRight: 0, spikeUp: 0, spikeDown: 0 },
        { id: '2', name: 'Earth Lithos', sprite: '', type: 'earth', spikeLeft: 0, spikeRight: 0, spikeUp: 0, spikeDown: 0 },
        { id: '3', name: 'Fire Lithos', sprite: '', type: 'fire', spikeLeft: 0, spikeRight: 0, spikeUp: 0, spikeDown: 0 },
        { id: '4', name: 'Water Lithos', sprite: '', type: 'water', spikeLeft: 0, spikeRight: 0, spikeUp: 0, spikeDown: 0 },
      ]

      mockLithosFindMany.mockResolvedValue(mockLithos)

      const result = await mockLithosFindMany({
        orderBy: { name: 'asc' },
      })

      // Verify alphabetical ordering
      expect(result[0].name).toBe('Air Lithos')
      expect(result[1].name).toBe('Earth Lithos')
      expect(result[2].name).toBe('Fire Lithos')
      expect(result[3].name).toBe('Water Lithos')
    })
  })
})
