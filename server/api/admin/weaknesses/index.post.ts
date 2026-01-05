export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const body = await readBody(event)

    if (!body.elementId || typeof body.elementId !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'elementId is required and must be a string',
      })
    }

    if (!body.weakAgainstId || typeof body.weakAgainstId !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'weakAgainstId is required and must be a string',
      })
    }

    if (body.elementId === body.weakAgainstId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'An element cannot be weak against itself',
      })
    }

    const element = await db.postgres.elements.findUnique({
      where: { id: body.elementId },
    })

    if (!element) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Element not found',
      })
    }

    const weakAgainst = await db.postgres.elements.findUnique({
      where: { id: body.weakAgainstId },
    })

    if (!weakAgainst) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Target element not found',
      })
    }

    const weakness = await db.postgres.weaknessElements.create({
      data: {
        elementId: body.elementId,
        weakAgainstId: body.weakAgainstId,
      },
      include: {
        element: true,
        weakAgainst: true,
      },
    })

    return {
      success: true,
      message: 'Weakness created successfully',
      data: weakness,
    }
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    if (error.code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'This weakness relationship already exists',
      })
    }

    if (error.statusCode) {
      throw error
    }

    console.error('Error creating weakness:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create weakness',
    })
  }
})
