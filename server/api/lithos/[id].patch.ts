// API route to update a lithos (admin only)
export default defineEventHandler(async (event) => {
    try {
        // Verify user is authenticated
        const user = getAuthUser(event)

        // Verify user has admin role
        requireRole(user, ['admin'])

        // Get lithos ID from URL parameter
        const id = getRouterParam(event, 'id')

        if (!id) {
            throw createError({
                statusCode: 400,
                statusMessage: 'Lithos ID is required'
            })
        }

        // Get request body data
        const body = await readBody(event)

        // Check if lithos exists
        const existingLithos = await db.postgres.lithos.findUnique({
            where: { id }
        })

        if (!existingLithos) {
            throw createError({
                statusCode: 404,
                statusMessage: 'Lithos not found'
            })
        }

        // Prepare update data object (only include provided fields)
        const updateData: any = {}

        if (body.name !== undefined) {
            updateData.name = body.name
        }

        if (body.sprite !== undefined) {
            updateData.sprite = body.sprite
        }

        if (body.type !== undefined) {
            updateData.type = body.type
        }

        // Validate and add spike values if provided
        if (body.spikeLeft !== undefined) {
            const spikeLeft = Number(body.spikeLeft)
            if (isNaN(spikeLeft) || spikeLeft < 0) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'spikeLeft must be a positive number'
                })
            }
            updateData.spikeLeft = spikeLeft
        }

        if (body.spikeRight !== undefined) {
            const spikeRight = Number(body.spikeRight)
            if (isNaN(spikeRight) || spikeRight < 0) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'spikeRight must be a positive number'
                })
            }
            updateData.spikeRight = spikeRight
        }

        if (body.spikeUp !== undefined) {
            const spikeUp = Number(body.spikeUp)
            if (isNaN(spikeUp) || spikeUp < 0) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'spikeUp must be a positive number'
                })
            }
            updateData.spikeUp = spikeUp
        }

        if (body.spikeDown !== undefined) {
            const spikeDown = Number(body.spikeDown)
            if (isNaN(spikeDown) || spikeDown < 0) {
                throw createError({
                    statusCode: 400,
                    statusMessage: 'spikeDown must be a positive number'
                })
            }
            updateData.spikeDown = spikeDown
        }

        // Check if there's anything to update
        if (Object.keys(updateData).length === 0) {
            throw createError({
                statusCode: 400,
                statusMessage: 'No valid fields to update'
            })
        }

        // Update the lithos
        const updatedLithos = await db.postgres.lithos.update({
            where: { id },
            data: updateData
        })

        return {
            success: true,
            message: 'Lithos updated successfully',
            data: updatedLithos
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

        // Re-throw known errors (400, 404, etc.)
        if (error.statusCode) {
            throw error
        }

        console.error('Error updating lithos:', error)
        throw createError({
            statusCode: 500,
            statusMessage: 'Error updating lithos'
        })
    }
})
