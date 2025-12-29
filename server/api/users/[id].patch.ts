// API route to update a user (user can update themselves or admin can update any user)
export default defineEventHandler(async (event) => {
  try {
    // Verify user is authenticated
    const authUser = getAuthUser(event)

    // Get user ID from URL parameter
    const id = getRouterParam(event, 'id')

    if (!id) {
      throw createError({
        statusCode: 400,
        statusMessage: 'User ID is required',
      })
    }

    // Get request body data
    const body = await readBody(event)

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

    // Check authorization: user can update themselves OR must be admin
    const isOwnProfile = existingUser.id === authUser.userId
    const isAdmin = authUser.role === 'admin'

    if (!isOwnProfile && !isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to update this user',
      })
    }

    // Prepare update data object (only include provided fields)
    const updateData: any = {}

    if (body.email !== undefined) {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(body.email)) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Invalid email format',
        })
      }

      // Check if email is already taken by another user
      const emailExists = await db.postgres.user.findFirst({
        where: {
          email: body.email,
          NOT: { id },
        },
      })

      if (emailExists) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Email already exists',
        })
      }

      updateData.email = body.email
    }

    if (body.username !== undefined) {
      // Check if username is already taken by another user
      const usernameExists = await db.postgres.user.findFirst({
        where: {
          username: body.username,
          NOT: { id },
        },
      })

      if (usernameExists) {
        throw createError({
          statusCode: 409,
          statusMessage: 'Username already exists',
        })
      }

      updateData.username = body.username
    }

    if (body.name !== undefined) {
      updateData.name = body.name || null
    }

    if (body.surname !== undefined) {
      updateData.surname = body.surname || null
    }

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No valid fields to update',
      })
    }

    // Update the user
    const updatedUser = await db.postgres.user.update({
      where: { id },
      data: updateData,
      include: {
        role: true,
      },
    })

    return {
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    }
  } catch (error: any) {
    // Re-throw authentication/authorization errors
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    // Re-throw known errors (400, 404, 409, etc.)
    if (error.statusCode) {
      throw error
    }

    console.error('Error updating user:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error updating user',
    })
  }
})
