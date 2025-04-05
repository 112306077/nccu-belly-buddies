import { ActionFunctionArgs } from '@remix-run/node'

import { eq } from 'drizzle-orm'
import { deleteFile, getUploadUrl } from '~/lib/db/asset.server'
import { userIs } from '~/lib/db/auth.server'
import { db, S3 } from '~/lib/db/db.server'
import { filesTable } from '~/lib/db/schema'
import { ConventionalActionResponse } from '~/lib/utils'
import { PresignRequestSchema, PresignResponseSchema } from './schema'

// Presign url for uploading assets, and delete function
export const action = async ({ request }: ActionFunctionArgs) => {
    if (request.method !== 'PUT' && request.method !== 'DELETE') {
        return new Response('Method Not Allowed', { status: 405 })
    }

    if (!S3) {
        return Response.json({
            err: 'Object storage not configured',
        } satisfies ConventionalActionResponse)
    }

    const { user: admin } = await userIs(request, ['ADMIN'])

    const jsonData = await request.json()

    // Validate DELETE request data
    if (request.method === 'DELETE') {
        const { key } = jsonData
        if (!key || typeof key !== 'string') {
            return new Response('Bad Request', { status: 400 })
        }

        try {
            // Delete file from ObjectStorage and DB
            await deleteFile(key)
            await db.delete(filesTable).where(eq(filesTable.key, key))

            return Response.json({
                msg: 'Files deleted successfully',
                options: { preventAlert: true },
            } satisfies ConventionalActionResponse)
        } catch (error) {
            console.log('Error deleting files', error)
            return Response.json({
                err: 'Failed to delete files',
            } satisfies ConventionalActionResponse)
        }
    }

    // Validate PUT request data
    const {
        data: fileMetadata,
        success,
        error,
    } = PresignRequestSchema.safeParse(jsonData)
    if (!success) {
        console.error('Invalidate request data', error)
        return new Response('Bad Request', { status: 400 })
    }

    try {
        // Get presigned URLs for all files
        const presignedUrls = await Promise.all(
            fileMetadata.map(async file => {
                const presignedUrl = await getUploadUrl({
                    key: file.key,
                    size: file.size,
                    type: file.type,
                    checksum: file.checksum,
                })
                return {
                    key: file.key,
                    presignedUrl,
                }
            })
        )

        // Store file metadata in DB
        const objectsInDatabase = await db.transaction(async tx => {
            return await tx
                .insert(filesTable)
                .values(
                    fileMetadata.map(file => ({
                        key: file.key,
                        name: file.name,
                        description: file.description,
                        userId: admin.id,
                        type: file.type,
                        size: file.size,
                    }))
                )
                .returning()
        })

        const validatedResponse = PresignResponseSchema.parse({
            urls: presignedUrls.map(url => {
                const objectInDatabase = objectsInDatabase.find(
                    object => object.key === url.key
                )
                if (!objectInDatabase) throw new Error('Object not found')
                return {
                    id: objectInDatabase.id,
                    updatedAt: objectInDatabase.updatedAt.toISOString(),
                    ...url,
                }
            }),
        })

        return Response.json({
            msg: 'Presign urls generated successfully',
            data: validatedResponse,
            options: { preventAlert: true },
        } satisfies ConventionalActionResponse)
    } catch (error) {
        console.log('Error generating presigned URLs', error)
        return Response.json({
            err: 'Failed to generate presigned URLs',
        } satisfies ConventionalActionResponse)
    }
}
