// API route to delete a user (admin only)
export default defineEventHandler(async (event) => {
  try {
    // Verify user is authenticated
    const user = getAuthUser(event)

    // Verify user has admin role
    requireRole(user, ['admin'])

    // Get user ID from URL parameter
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required',
      })
    }

    // Check if user exists
    const existingUser = await db.postgres.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    })

    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    // Prevent admin from deleting themselves
    if (existingUser.id === user.userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'You cannot delete your own account',
      })
    }

    // Delete the user (authentication and collections will be deleted by cascade)
    await db.postgres.user.delete({
      where: { id },
    })

    return {
      success: true,
      message: `User ${existingUser.username} deleted successfully`,
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

    console.error('Error deleting user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error deleting user',
    })
  }
})
