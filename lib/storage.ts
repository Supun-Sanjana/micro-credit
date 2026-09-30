import { supabase } from "./supabase"
import crypto from "crypto"

const BUCKET_NAME = "documents"
/** Maximum size allowed per individual document file: 1 MB */
const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1 MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"]

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

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false,
    })

  if (error) {
    throw new Error(`Upload failed: ${error.message}`)
  }

  return { storagePath, fileName: file.name, mimeType: file.type, fileSize: file.size }
}

export async function generateSignedUrl(storagePath: string) {
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(storagePath, 300) // 5 minutes

  if (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`)
  }

  return data.signedUrl
}
