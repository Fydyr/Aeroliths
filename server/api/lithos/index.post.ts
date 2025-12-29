// API route to create a new lithos (admin only)
export default defineEventHandler(async (event) => {
    try {
        // Verify user is authenticated
        const user = getAuthUser(event)

        // Verify user has admin role
        requireRole(user, ['admin'])

        // Get request body data
        const body = await readBody(event)

        // Validate required fields
        if (!body.name || !body.sprite || !body.type) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Fields name, sprite and type are required'
            })
        }

        // Validate spike values (must be numbers)
        const spikeLeft = Number(body.spikeLeft) || 0
        const spikeRight = Number(body.spikeRight) || 0
        const spikeUp = Number(body.spikeUp) || 0
        const spikeDown = Number(body.spikeDown) || 0

        if (spikeLeft < 0 || spikeRight < 0 || spikeUp < 0 || spikeDown < 0) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Spike values must be positive'
            })
        }

        // Create the lithos
        const lithos = await db.postgres.lithos.create({
            data: {
                name: body.name,
                sprite: body.sprite,
                spikeLeft,
                spikeRight,
                spikeUp,
                spikeDown,
                type: body.type
            }
        })

        return {
            success: true,
            message: 'Lithos created successfully',
            data: lithos
        }
    } catch (error: any) {
        // Handle unique constraint error (lithos with same name already exists)
        if (error.code === 'P2002') {
            throw createError({
                statusCode: 409,
                statusMessage: 'A lithos with this name already exists'
            })
        }

        // Re-throw authentication/authorization errors
        if (error.statusCode === 401 || error.statusCode === 403) {
            throw error
        }

        console.error('Error creating lithos:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Error creating lithos'
        })
    }
})
