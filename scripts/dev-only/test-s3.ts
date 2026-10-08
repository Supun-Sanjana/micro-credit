import { uploadDocument, generateSignedUrl } from "../../lib/storage"
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"
import * as dotenv from "dotenv"

// Load env vars
dotenv.config({ path: ".env" })
dotenv.config({ path: ".env.local" })

async function runTest() {
  console.log("Starting Neon S3 upload test...")
  
  // Minimal valid 1x1 PNG transparent image
  const dummyContent = new Uint8Array([
    137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6, 0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 11, 73, 68, 65, 84, 8, 153, 99, 248, 15, 4, 0, 9, 251, 3, 253, 227, 85, 242, 156, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130
  ])
  
  const file = new File([dummyContent], "test-image.png", { type: "image/png" })
  
  const orgId = "test-org-123"
  const memberId = "test-member-456"
  
  let uploadedPath = ""
  
  try {
    console.log("1. Uploading document to 'documents' bucket...")
    const result = await uploadDocument(file, orgId, memberId, "Test Member")
    console.log("   ✅ Upload successful!")
    console.log("   Result:", result)
    
    uploadedPath = result.storagePath
    
    console.log("\n2. Generating signed URL...")
    const signedUrl = await generateSignedUrl(uploadedPath)
    console.log("   ✅ Signed URL generated successfully!")
    console.log("   URL:", signedUrl.substring(0, 100) + "...")
    
  } catch (error) {
    console.error("❌ Test failed:", error)
  } finally {
    console.log("\n--- Test Completed. File was NOT deleted so you can check your bucket! ---")
  }
}

runTest()
