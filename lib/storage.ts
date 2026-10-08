import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import crypto from "crypto"

const BUCKET_NAME = "documents"
/** Maximum size allowed per individual document file: 1 MB */
const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

// Initialize the S3 client for Neon Storage
const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.AWS_ENDPOINT_URL_S3, 
  forcePathStyle: true,
  // credentials are automatically picked up from process.env.AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
})

export async function uploadDocument(file: File, orgId: string, memberId: string, memberName?: string) {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed types: JPEG, PNG, WEBP, PDF.`)
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum allowed per document is 1 MB.`
    )
  }

  const uuid = crypto.randomUUID()
  
  // Format member name to be folder-safe if provided
  let folderName = memberId
  if (memberName) {
    const safeName = memberName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()
    folderName = `${safeName}_${memberId.substring(0, 8)}`
  }
  
  const storagePath = `${orgId}/${folderName}/${uuid}`

  // Convert File to ArrayBuffer, then Buffer
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: storagePath,
        Body: buffer,
        ContentType: file.type,
      })
    )
  } catch (error: any) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  return { storagePath, fileName: file.name, mimeType: file.type, fileSize: file.size }
}

export async function generateSignedUrl(storagePath: string) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: storagePath,
    })
    
    // Generate signed URL valid for 5 minutes (300 seconds)
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 })
    return signedUrl
  } catch (error: any) {
    throw new Error(`Failed to generate signed URL: ${error.message}`)
  }
}
