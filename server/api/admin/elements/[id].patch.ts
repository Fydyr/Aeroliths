import db from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Element ID is required',
      })
    }

    const body = await readBody(event)

    const existing = await db.postgres.elements.findUnique({
      where: { id },
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Element not found',
      })
    }

    const updateData: any = {}

    if (body.name !== undefined) {
      if (typeof body.name !== 'string') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Element name must be a string',
        })
      }
      updateData.name = body.name
    }

    if (body.sprite !== undefined) {
      if (typeof body.sprite !== 'string') {
        throw createError({
          statusCode: 400,
          statusMessage: 'Element sprite must be a string',
        })
      }
      updateData.sprite = body.sprite
    }

    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No valid fields to update',
      })
    }

    const updated = await db.postgres.elements.update({
      where: { id },
      data: updateData,
    })

    return {
      success: true,
      message: 'Element updated successfully',
      data: updated,
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

    console.error('Error updating element:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to update element',
    })
  }
})
