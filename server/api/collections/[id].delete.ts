// API route to delete a collection (user can delete their own)
export default defineEventHandler(async (event) => {
  try {
    // Verify user is authenticated
    const user = getAuthUser(event)

    // Get collection ID from URL parameter
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Collection ID is required',
      })
    }

    // Check if collection exists
    const existingCollection = await db.postgres.collections.findUnique({
      where: { id },
    })

    if (!existingCollection) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Collection not found',
      })
    }

    // Verify user owns this collection
    if (existingCollection.userId !== user.userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to delete this collection',
      })
    }

    // Delete the collection
    await db.postgres.collections.delete({
      where: { id },
    })

    return {
      success: true,
      message: 'Collection deleted successfully',
    }
  } catch (error: any) {
    // Re-throw known errors
    if (error.statusCode) {
      throw error
    }

    console.error('Error deleting collection:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error deleting collection',
    })
  }
})
