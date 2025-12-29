import bcrypt from 'bcrypt'

// API route to update user password (user can update their own password or admin can update any password)
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
    const body = await readBody(event) as { currentPassword?: string; newPassword?: string }

    const { currentPassword, newPassword } = body

    // Validate required fields
    if (!newPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: 'New password is required',
      })
    }

    // Validate new password strength (minimum 8 characters)
    if (newPassword.length < 8) {
      throw createError({
        statusCode: 400,
        statusMessage: 'New password must be at least 8 characters long',
      })
    }

    // Check if user exists
    const existingUser = await db.postgres.user.findUnique({
      where: { id },
      include: {
        authentication: true,
        role: true,
      },
    })

    if (!existingUser) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User not found',
      })
    }

    if (!existingUser.authentication) {
      throw createError({
        statusCode: 404,
        statusMessage: 'User authentication not found',
      })
    }

    // Check authorization: user can update their own password OR must be admin
    const isOwnProfile = existingUser.id === authUser.userId
    const isAdmin = authUser.role === 'admin'

    if (!isOwnProfile && !isAdmin) {
      throw createError({
        statusCode: 403,
        statusMessage: 'You do not have permission to update this password',
      })
    }

    // If user is updating their own password, verify current password
    if (isOwnProfile && !isAdmin) {
      if (!currentPassword) {
        throw createError({
          statusCode: 400,
          statusMessage: 'Current password is required',
        })
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(
        currentPassword,
        existingUser.authentication.password
      )

      if (!isPasswordValid) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Current password is incorrect',
        })
      }
    }

    // Admin can change password without knowing current password
    // Hash the new password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    // Update the password
    await db.postgres.authentication.update({
      where: { userId: id },
      data: {
        password: hashedPassword,
      },
    })

    return {
      success: true,
      message: 'Password updated successfully',
    }
  } catch (error: any) {
    // Re-throw authentication/authorization errors
    if (error.statusCode === 401 || error.statusCode === 403) {
      throw error
    }

    // Re-throw known errors (400, 404, etc.)
    if (error.statusCode) {
      throw error
    }

    console.error('Error updating password:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error updating password',
    })
  }
})
