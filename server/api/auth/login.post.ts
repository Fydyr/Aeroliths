import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import type { SignOptions } from 'jsonwebtoken'

// API route to authenticate user and return JWT token
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

    const { email, password } = body

    // Validate required fields
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        message: 'Email and password are required',
      })
    }

    // Find user by email with authentication
    const user = await db.postgres.user.findUnique({
      where: { email },
      include: {
        authentication: true,
        role: true,
      },
    })

    if (!user || !user.authentication) {
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password',
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.authentication.password)

    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: 'Invalid email or password',
      })
    }

    // Get JWT secret from environment
    const jwtSecret = process.env.JWT_SECRET
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined in environment variables')
      throw createError({
        statusCode: 500,
        message: 'Server configuration error',
      })
    }

    // Generate JWT token
    const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
    const signOptions: SignOptions = {
      expiresIn: expiresIn as SignOptions['expiresIn'],
    }
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        username: user.username,
        role: user.role.name,
      },
      jwtSecret,
      signOptions
    )

    // Remove sensitive data
    const { authentication, ...userWithoutAuth } = user

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: userWithoutAuth,
        token,
        expiresIn,
      },
    }
  } catch (error) {
    if (error && typeof error === 'object' && 'statusCode' in error) {
      throw error
    }
    console.error('Error during login:', error)
    throw createError({
      statusCode: 500,
      message: 'Login failed',
    })
  }
})
