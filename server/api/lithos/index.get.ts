// API route to get all Lithos from PostgreSQL database
export default defineEventHandler(async (event) => {
  try {
    const lithos = await db.postgres.lithos.findMany({
      orderBy: {
        name: 'asc',
      },
      include: {
        element: true,
      },
    })

    return {
      success: true,
      data: lithos,
      count: lithos.length,
    }
  } catch (error) {
    console.error('Error fetching lithos:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch lithos',
    })
  }
})
