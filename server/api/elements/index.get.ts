export default defineEventHandler(async (event) => {
  try {
    const elements = await db.postgres.elements.findMany({
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

    return {
      success: true,
      data: elements,
      count: elements.length,
    }
  } catch (error) {
    console.error('Error fetching elements:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch elements',
    })
  }
})
