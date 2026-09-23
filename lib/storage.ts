import { supabase } from "./supabase"
import crypto from "crypto"

const BUCKET_NAME = "member-documents"
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_PDF_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"]

export async function uploadDocument(file: File, orgId: string, memberId: string) {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(`Invalid file type: ${file.type}. Allowed types: ${ALLOWED_MIME_TYPES.join(", ")}`)
  }

  const maxSize = file.type === "application/pdf" ? MAX_PDF_SIZE : MAX_IMAGE_SIZE
  if (file.size > maxSize) {
    throw new Error(`File size exceeds limit: ${file.size} > ${maxSize}`)
  }

  const uuid = crypto.randomUUID()
  const storagePath = `${orgId}/${memberId}/${uuid}`

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType: file.type,
      upsert: false
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
