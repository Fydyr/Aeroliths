// API route to get a specific collection by ID
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

    // Get the collection with lithos details
    const collection = await db.postgres.collections.findUnique({
      where: { id },
      include: {
        lithos: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    })

    if (!collection) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Collection not found',
      })
    }

    // Verify user owns this collection
    if (collection.userId !== user.userId) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to access this collection',
      })
    }

    return {
      success: true,
      data: collection,
    }
  } catch (error: any) {
    // Re-throw known errors
    if (error.statusCode) {
      throw error
    }

    console.error('Error fetching collection:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch collection',
    })
  }
})
