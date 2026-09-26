import { getScopedDal } from "@/lib/dal"
import { DocumentsClient } from "./client"

export default async function DocumentsVerificationPage() {
  const { role } = await getScopedDal()

  if (role !== "BRANCH_MANAGER" && role !== "HEAD_OFFICE" && role !== "SYSTEM_ADMIN") {
    return (
      <div className="p-8 text-center text-red-600">
        You do not have permission to view this page. Current role: {role || "Unknown"}
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Document Verification</h1>
      </div>
      <DocumentsClient />
    </div>
  )
}
