// API route to delete a lithos (admin only)
export default defineEventHandler(async (event) => {
  try {
    // Verify user is authenticated
    const user = getAuthUser(event)

    // Verify user has admin role
    requireRole(user, ['admin'])

    // Get lithos ID from URL parameter
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Lithos ID is required',
      })
    }

    // Check if lithos exists
    const existingLithos = await db.postgres.lithos.findUnique({
      where: { id },
    })

    if (!existingLithos) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Lithos not found',
      })
    }

    // Delete the lithos (collections will be deleted by cascade)
    await db.postgres.lithos.delete({
      where: { id },
    })

    return {
      success: true,
      message: `Lithos ${existingLithos.name} deleted successfully`,
    }
  } catch (error: any) {
    // Re-throw authentication/authorization errors
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    // Re-throw known errors
    if (error.statusCode) {
      throw error
    }

    console.error('Error deleting lithos:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error deleting lithos',
    })
  }
})
