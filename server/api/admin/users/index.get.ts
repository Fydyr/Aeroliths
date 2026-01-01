// API route to get all users (admin only)
export default defineEventHandler(async (event) => {
  try {
    // Verify user is authenticated
    const user = getAuthUser(event)

    // Verify user has admin role
    requireRole(user, ['admin'])

    // Get all users with their roles
    const users = await db.postgres.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        surname: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            name: true,
          },
        },
        collections: {
          select: {
            id: true,
            quantity: true,
            lithos: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      success: true,
      message: 'Users retrieved successfully',
      data: {
        users,
        count: users.length,
      },
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

    console.error('Error retrieving users:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error retrieving users',
    })
  }
})
