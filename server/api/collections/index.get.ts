// API route to get all collections for authenticated user
export default defineEventHandler(async (event) => {
  try {
    // Verify user is authenticated
    const user = getAuthUser(event)

    // Get collections for this user with lithos details
    const collections = await db.postgres.collections.findMany({
      where: {
        userId: user.userId,
      },
      include: {
        lithos: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      success: true,
      data: collections,
      count: collections.length,
    }
  } catch (error: any) {
    // Re-throw authentication errors
    if (error.statusCode === 401) {
      throw error
    }

    console.error('Error fetching collections:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch collections',
    })
  }
})
