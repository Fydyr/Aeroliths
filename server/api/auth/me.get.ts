// API route to get current authenticated user information
export default defineEventHandler(async (event) => {
  try {
    // Get authenticated user from token
    const user = getAuthUser(event)

    // Fetch full user details from database
    const userDetails = await db.postgres.user.findUnique({
      where: { id: user.userId },
      include: {
        role: true,
      },
    })

    if (!userDetails) {
      throw createError({
        statusCode: 404,
        message: 'User not found',
      })
    }

    return {
      success: true,
      data: userDetails,
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    console.error('Error fetching user details:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch user details',
    })
  }
})
