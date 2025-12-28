// API route to get a single Lithos by ID
export default defineEventHandler(async (event) => {
  try {
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        message: 'Lithos ID is required',
      })
    }

    const lithos = await db.postgres.lithos.findUnique({
      where: {
        id,
      },
    })

    if (!lithos) {
      throw createError({
        statusCode: 404,
        message: 'Lithos not found',
      })
    }

    return {
      success: true,
      data: lithos,
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    console.error('Error fetching lithos:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch lithos',
    })
  }
})
