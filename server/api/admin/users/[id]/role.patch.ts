// API route to update a user's role (admin only)
export default defineEventHandler(async (event) => {
  try {
    // Verify user is authenticated
    const authUser = getAuthUser(event)

    // Verify user has admin role
    requireRole(authUser, ['admin'])

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

    if (!body.roleName || typeof body.roleName !== 'string') {
      throw createError({
        statusCode: 400,
        statusMessage: 'Role name is required',
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

    // Prevent admin from changing their own role
    if (existingUser.id === authUser.userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'You cannot change your own role',
      })
    }

    // Validate role exists
    const role = await db.postgres.role.findUnique({
      where: { name: body.roleName },
    })

    if (!role) {
      throw createError({
        statusCode: 404,
        statusMessage: `Role '${body.roleName}' not found`,
      })
    }

    // Check if user already has this role
    if (existingUser.roleId === role.id) {
      throw createError({
        statusCode: 400,
        statusMessage: `User already has the '${body.roleName}' role`,
      })
    }

    // Update the user's role
    const updatedUser = await db.postgres.user.update({
      where: { id },
      data: {
        roleId: role.id,
      },
      include: {
        role: true,
      },
    })

    return {
      success: true,
      message: `User role updated to '${role.name}' successfully`,
      data: updatedUser,
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

    console.error('Error updating user role:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error updating user role',
    })
  }
})
