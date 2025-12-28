import bcrypt from 'bcrypt'

// API route to create a new user with authentication
export default defineEventHandler(async (event) => {
  try {
    let body = await readBody(event)

    // Parse JSON if body is a string
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch (e) {
        throw createError({
          statusCode: 400,
          message: 'Invalid JSON format',
        })
      }
    }

    const { email, username, password, name, surname } = body

    // Validate required fields
    if (!email || !username || !password) {
      throw createError({
        statusCode: 400,
        message: 'Email, username, and password are required',
      })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid email format',
      })
    }

    // Validate password strength (minimum 8 characters)
    if (password.length < 8) {
      throw createError({
        statusCode: 400,
        message: 'Password must be at least 8 characters long',
      })
    }

    // Check if user role exists, if not create it
    let userRole = await db.postgres.role.findUnique({
      where: { name: 'user' },
    })

    if (!userRole) {
      userRole = await db.postgres.role.create({
        data: { name: 'user' },
      })
    }

    // Check if email or username already exists
    const existingUser = await db.postgres.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    })

    if (existingUser) {
      throw createError({
        statusCode: 409,
        message: existingUser.email === email ? 'Email already exists' : 'Username already exists',
      })
    }

    // Hash the password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user with authentication in a transaction
    const user = await db.postgres.user.create({
      data: {
        email,
        username,
        name: name || null,
        surname: surname || null,
        roleId: userRole.id,
        authentication: {
          create: {
            password: hashedPassword,
          },
        },
      },
      include: {
        role: true,
      },
    })

    // Remove sensitive data from response
    const { authentication, ...userWithoutAuth } = user as any

    return {
      success: true,
      data: userWithoutAuth,
      message: 'User created successfully',
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    console.error('Error creating user:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create user',
    })
  }
})
