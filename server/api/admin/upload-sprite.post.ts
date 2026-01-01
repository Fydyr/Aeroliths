import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'

// API route to upload sprite images (admin only)
export default defineEventHandler(async (event) => {
  try {
    // Verify user is authenticated
    const user = getAuthUser(event)

    // Verify user has admin role
    requireRole(user, ['admin'])

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

    // Generate unique filename
    const timestamp = Date.now()
    const ext = file.filename.split('.').pop()
    const filename = `sprite-${timestamp}.${ext}`

    // Define the upload directory (public/sprites to be accessible from frontend)
    const uploadDir = join(process.cwd(), 'public', 'sprites')

    // Create directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Write file to disk
    const filePath = join(uploadDir, filename)
    await writeFile(filePath, file.data)

    // Return the public URL path
    const publicPath = `/sprites/${filename}`

    return {
      success: true,
      message: 'Sprite uploaded successfully',
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
