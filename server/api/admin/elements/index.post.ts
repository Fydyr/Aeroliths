export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const body = await readBody(event)

    if (!body.name || typeof body.name !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Element name is required and must be a string',
      })
    }

    if (!body.sprite || typeof body.sprite !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Element sprite is required and must be a string',
      })
    }

    const element = await db.postgres.elements.create({
      data: {
        name: body.name,
        sprite: body.sprite,
      },
    })

    return {
      success: true,
      message: 'Element created successfully',
      data: element,
    }
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    if (error.code === 'P2002') {
      throw createError({
        statusCode: 409,
        statusMessage: 'An element with this name already exists',
      })
    }

    if (error.statusCode) {
      throw error
    }

    console.error('Error creating element:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to create element',
    })
  }
})
