import db from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Element ID is required',
      })
    }

    const element = await db.postgres.elements.findUnique({
      where: { id },
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

    if (!element) {
      throw createError({
        statusCode: 404,
        message: 'Element not found',
      })
    }

    return {
      success: true,
      data: element,
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    console.error('Error fetching element:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch element',
    })
  }
})
