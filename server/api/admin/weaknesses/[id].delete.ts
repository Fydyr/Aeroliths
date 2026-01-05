import db from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  try {
    const user = getAuthUser(event)
    requireRole(user, ['admin'])

    const id = getRouterParam(event, 'id')
    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Weakness ID is required',
      })
    }

    const existing = await db.postgres.weaknessElements.findUnique({
      where: { id },
    })

    if (!existing) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Weakness not found',
      })
    }

    await db.postgres.weaknessElements.delete({
      where: { id },
    })

    return {
      success: true,
      message: 'Weakness deleted successfully',
    }
  } catch (error: any) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    if (error.statusCode) {
      throw error
    }

    console.error('Error deleting weakness:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to delete weakness',
    })
  }
})
