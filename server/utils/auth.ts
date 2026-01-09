import jwt from 'jsonwebtoken'
import type { H3Event } from 'h3'

export interface JWTPayload {
  userId: string
  email: string
  username: string
  role: string
}

/**
 * Verify JWT token and return decoded payload
 */
export function verifyToken(token: string): JWTPayload {
  const jwtSecret = process.env.JWT_SECRET
  if (!jwtSecret) {
    throw createError({
      statusCode: 500,
      message: 'Server configuration error',
    })
  }

  try {
    const decoded = jwt.verify(token, jwtSecret) as JWTPayload
    return decoded
  } catch (error) {
    throw createError({
      statusCode: 401,
      message: 'Invalid or expired token',
    })
  }
}

/**
 * Extract and verify token from Authorization header or cookie
 */
export function getAuthUser(event: H3Event): JWTPayload {
  // First try to get token from Authorization header
  const authHeader = getHeader(event, 'authorization')

  if (authHeader) {
    // Expected format: "Bearer <token>"
    const [type, token] = authHeader.split(' ')

    if (type === 'Bearer' && token) {
      return verifyToken(token)
    }
  }

  // If no Authorization header, try to get token from cookie
  const tokenFromCookie = getCookie(event, 'auth_token')

  if (tokenFromCookie) {
    return verifyToken(tokenFromCookie)
  }

  // No token found in header or cookie
  throw createError({
    statusCode: 401,
    message: 'Authentication required',
  })
}

/**
 * Check if user has required role
 */
export function requireRole(user: JWTPayload, allowedRoles: string[]) {
  if (!allowedRoles.includes(user.role)) {
    throw createError({
      statusCode: 403,
      message: 'Insufficient permissions',
    })
  }
}
