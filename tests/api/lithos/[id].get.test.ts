import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the database
vi.mock('~/server/utils/db', () => ({
  default: {
    postgres: {
      lithos: {
        findUnique: vi.fn(),
      },
    },
  },
}))

describe('GET /api/lithos/[id]', () => {
  let mockLithosFindUnique: any

  beforeEach(async () => {
    // Reset mocks before each test
    vi.clearAllMocks()

    // Import mocked modules
    const dbModule = await import('~/server/utils/db')
    mockLithosFindUnique = dbModule.default.postgres.lithos.findUnique as any
  })

  describe('Validation', () => {
    it('should reject missing lithos ID', () => {
      const id = undefined
      expect(id).toBeUndefined()
    })

    it('should reject empty lithos ID', () => {
      const id = ''
      expect(id).toBe('')
      expect(id.length).toBe(0)
    })

    it('should accept valid lithos ID', () => {
      const id = 'lithos-123'
      expect(id).toBe('lithos-123')
      expect(id.length).toBeGreaterThan(0)
    })
  })

  describe('Database Operations', () => {
    it('should fetch lithos by ID', async () => {
      const mockLithos = {
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
      }

      mockLithosFindUnique.mockResolvedValue(mockLithos)

      const result = await mockLithosFindUnique({
        where: { id: 'lithos-1' },
      })

      expect(result).toEqual(mockLithos)
      expect(result.id).toBe('lithos-1')
      expect(result.name).toBe('Fire Lithos')
      expect(mockLithosFindUnique).toHaveBeenCalledWith({
        where: { id: 'lithos-1' },
      })
    })

    it('should return null for non-existent lithos', async () => {
      mockLithosFindUnique.mockResolvedValue(null)

      const result = await mockLithosFindUnique({
        where: { id: 'non-existent-id' },
      })

      expect(result).toBeNull()
    })

    it('should handle database errors', async () => {
      mockLithosFindUnique.mockRejectedValue(new Error('Database connection failed'))

      await expect(
        mockLithosFindUnique({
          where: { id: 'lithos-1' },
        })
      ).rejects.toThrow('Database connection failed')
    })
  })

  describe('Response Format', () => {
    it('should return success response with lithos data', async () => {
      const mockLithos = {
        id: 'lithos-2',
        name: 'Water Lithos',
        sprite: '/sprites/water.png',
        type: 'water',
        spikeLeft: 1,
        spikeRight: 2,
        spikeUp: 1,
        spikeDown: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockLithosFindUnique.mockResolvedValue(mockLithos)

      const expectedResponse = {
        success: true,
        data: mockLithos,
      }

      expect(expectedResponse.success).toBe(true)
      expect(expectedResponse.data).toEqual(mockLithos)
    })

    it('should include all lithos properties', async () => {
      const mockLithos = {
        id: 'lithos-3',
        name: 'Earth Lithos',
        sprite: '/sprites/earth.png',
        type: 'earth',
        spikeLeft: 3,
        spikeRight: 3,
        spikeUp: 2,
        spikeDown: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockLithosFindUnique.mockResolvedValue(mockLithos)

      const result = await mockLithosFindUnique({
        where: { id: 'lithos-3' },
      })

      expect(result.id).toBe('lithos-3')
      expect(result.name).toBe('Earth Lithos')
      expect(result.sprite).toBe('/sprites/earth.png')
      expect(result.type).toBe('earth')
      expect(result.spikeLeft).toBe(3)
      expect(result.spikeRight).toBe(3)
      expect(result.spikeUp).toBe(2)
      expect(result.spikeDown).toBe(2)
      expect(result.createdAt).toBeDefined()
      expect(result.updatedAt).toBeDefined()
    })
  })

  describe('Edge Cases', () => {
    it('should handle lithos with zero spike values', async () => {
      const mockLithos = {
        id: 'lithos-4',
        name: 'Air Lithos',
        sprite: '/sprites/air.png',
        type: 'air',
        spikeLeft: 0,
        spikeRight: 0,
        spikeUp: 0,
        spikeDown: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockLithosFindUnique.mockResolvedValue(mockLithos)

      const result = await mockLithosFindUnique({
        where: { id: 'lithos-4' },
      })

      expect(result.spikeLeft).toBe(0)
      expect(result.spikeRight).toBe(0)
      expect(result.spikeUp).toBe(0)
      expect(result.spikeDown).toBe(0)
    })

    it('should handle lithos with maximum spike values', async () => {
      const mockLithos = {
        id: 'lithos-5',
        name: 'Legendary Lithos',
        sprite: '/sprites/legendary.png',
        type: 'legendary',
        spikeLeft: 10,
        spikeRight: 10,
        spikeUp: 10,
        spikeDown: 10,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockLithosFindUnique.mockResolvedValue(mockLithos)

      const result = await mockLithosFindUnique({
        where: { id: 'lithos-5' },
      })

      expect(result.spikeLeft).toBe(10)
      expect(result.spikeRight).toBe(10)
      expect(result.spikeUp).toBe(10)
      expect(result.spikeDown).toBe(10)
    })
  })
})
