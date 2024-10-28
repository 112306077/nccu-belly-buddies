import { PrismaClient } from '@prisma/client'

export const prisma = new PrismaClient()

import { S3Client } from '@aws-sdk/client-s3'

const ACCESS_KEY_ID = process.env.OBJECT_STORAGE_ACCESS_KEY_ID
const SECRET_ACCESS_KEY = process.env.OBJECT_STORAGE_SECRET_ACCESS_KEY
const ACCOUNT_ID = process.env.OBJECT_STORAGE_ACCOUNT_ID

if (!ACCESS_KEY_ID || !SECRET_ACCESS_KEY || !ACCOUNT_ID) {
    console.warn(
        `Object Storage: S3Client Missing ${
            !ACCESS_KEY_ID ? 'OBJECT_STORAGE_ACCESS_KEY_ID' : ''
        },
        ${!SECRET_ACCESS_KEY ? 'OBJECT_STORAGE_SECRET_ACCESS_KEY' : ''},
        ${!ACCOUNT_ID ? 'OBJECT_STORAGE_ACCOUNT_ID' : ''}
        `.replace(/\s+/g, ' ')
    )
}

export const S3 =
    ACCESS_KEY_ID && SECRET_ACCESS_KEY && ACCOUNT_ID
        ? new S3Client({
              region: 'auto',
              endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
              credentials: {
                  accessKeyId: ACCESS_KEY_ID,
                  secretAccessKey: SECRET_ACCESS_KEY,
              },
          })
        : null
