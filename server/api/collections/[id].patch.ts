// API route to update a collection (quantity only)
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

    // Get request body data
    const body = await readBody(event)

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
        statusMessage: 'You do not have permission to update this collection',
      })
    }

    // Prepare update data object
    const updateData: any = {}

    // Validate and add quantity if provided
    if (body.quantity !== undefined) {
      const quantity = Number(body.quantity)
      if (isNaN(quantity) || quantity < 0) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Quantity must be a non-negative number',
        })
      }
      updateData.quantity = quantity
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No valid fields to update',
      })
    }

    // Update the collection
    const updatedCollection = await db.postgres.collections.update({
      where: { id },
      data: updateData,
      include: {
        lithos: true,
      },
    })

    return {
      success: true,
      message: 'Collection updated successfully',
      data: updatedCollection,
    }
  } catch (error: any) {
    // Re-throw known errors
    if (error.statusCode) {
      throw error
    }

    console.error('Error updating collection:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error updating collection',
    })
  }
})
