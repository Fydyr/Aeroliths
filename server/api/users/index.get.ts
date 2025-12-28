// Example API route using Prisma (PostgreSQL)
export default defineEventHandler(async (event) => {
  try {
    const users = await db.postgres.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })

    return {
      success: true,
      data: users,
      count: users.length,
    }
  } catch (error) {
    console.error('Error fetching users:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch users',
    })
  }
})
