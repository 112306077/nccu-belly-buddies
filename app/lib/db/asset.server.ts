/**
 * @see https://developers.cloudflare.com/r2/examples/aws/aws-sdk-js-v3/
 */
import {
	DeleteObjectCommand,
	GetObjectCommand,
	PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { S3 } from '~/lib/db/db.server'

export const getUploadUrl = async ({
	bucket = 'papa',
	key,
	size,
	type,
	checksum,
}: {
	bucket?: string
	key: string
	size: number
	type: string
	checksum: string
}) => {
	if (!S3) return null

	try {
		// https://docs.aws.amazon.com/AmazonS3/latest/userguide/checking-object-integrity.html
		const presignedUrl = await getSignedUrl(
			S3,
			new PutObjectCommand({
				Bucket: bucket,
				Key: key,
				ContentLength: size,
				ContentType: type,
				ChecksumSHA256: checksum,
			}),
			{ expiresIn: 300 }
		)
		return presignedUrl
	} catch (error) {
		console.error('Presign url error', error)
		return null
	}
}

export const getFileUrl = async (key: string) => {
	if (!S3) return null

	try {
		const command = new GetObjectCommand({
			Bucket: 'papa',
			Key: key,
		})
		const presignedUrl = await getSignedUrl(S3, command, { expiresIn: 300 })
		return presignedUrl
	} catch (error) {
		console.error('Presign url error', error)
		return null
	}
}

/**
 * Please handle the error in the caller function
 * @param key
 * @returns void
 */
export const deleteFile = async (key: string) => {
	if (!S3) return null

	await S3.send(
		new DeleteObjectCommand({
			Bucket: 'papa',
			Key: key,
		})
	)
}
