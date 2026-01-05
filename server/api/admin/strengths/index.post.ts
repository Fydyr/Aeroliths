import db from '~/server/utils/db'

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

    if (!body.strongAgainstId || typeof body.strongAgainstId !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'strongAgainstId is required and must be a string',
      })
    }

    if (body.elementId === body.strongAgainstId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'An element cannot be strong against itself',
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

    const strongAgainst = await db.postgres.elements.findUnique({
      where: { id: body.strongAgainstId },
    })

    if (!strongAgainst) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Target element not found',
      })
    }

    const strength = await db.postgres.strengthElements.create({
      data: {
        elementId: body.elementId,
        strongAgainstId: body.strongAgainstId,
      },
      include: {
        element: true,
        strongAgainst: true,
      },
    })

    return {
      success: true,
      message: 'Strength created successfully',
      data: strength,
    }
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    if (error.code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'This strength relationship already exists',
      })
    }

    if (error.statusCode) {
      throw error
    }

    console.error('Error creating strength:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create strength',
    })
  }
})
