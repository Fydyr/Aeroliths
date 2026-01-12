import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// API route to upload images (admin only for lithos/elements, authenticated for profile)
export default defineEventHandler(async (event) => {
  try {
    // Verify user is authenticated (checks both Authorization header and cookie)
    const user = getAuthUser(event)

    // Get the upload type from query parameter (lithos, elements, or profile)
    const query = getQuery(event)
    const uploadType = (query.type as string) || 'lithos'

    // Validate upload type
    const validTypes = ['lithos', 'elements', 'profile']
    if (!validTypes.includes(uploadType)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid upload type. Must be: lithos, elements, or profile',
      })
    }

    // Verify user has admin role for lithos and elements uploads
    if (uploadType === 'lithos' || uploadType === 'elements') {
      requireRole(user, ['admin'])
    }

    // Get the uploaded file
    const form = await readMultipartFormData(event)

    if (!form || form.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file uploaded',
      })
    }

    const file = form[0]

    if (!file.filename || !file.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid file data',
      })
    }

    // Validate file type (only images)
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type || '')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Only image files are allowed (PNG, JPG, GIF, WEBP)',
      })
    }

    // Determine the subdirectory based on upload type
    const subDir = uploadType === 'lithos' ? 'lithos' :
                   uploadType === 'elements' ? 'elements' :
                   'profile_pictures'

    // Generate unique filename
    const timestamp = Date.now()
    const ext = file.filename.split('.').pop()
    const filename = uploadType === 'profile'
      ? `profile-${user.id}-${timestamp}.${ext}`
      : `${uploadType}-${timestamp}.${ext}`

    // Define the upload directory
    const uploadDir = join(process.cwd(), 'public', subDir)

    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Write file to disk
    const filePath = join(uploadDir, filename)
    await writeFile(filePath, file.data)

    // Return the public URL path
    const publicPath = `/${subDir}/${filename}`

    return {
      success: true,
      message: `${uploadType.charAt(0).toUpperCase() + uploadType.slice(1)} image uploaded successfully`,
      data: {
        filename,
        path: publicPath,
      },
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

    console.error('Error uploading sprite:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Error uploading sprite',
    })
  }
})
