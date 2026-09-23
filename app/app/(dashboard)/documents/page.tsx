import { getScopedDal } from "@/lib/dal"
import { DocumentsClient } from "./client"
import { redirect } from "next/navigation"

export default async function DocumentsVerificationPage() {
  const { role } = await getScopedDal()

  if (role !== "BRANCH_MANAGER" && role !== "HEAD_OFFICE" && role !== "SYSTEM_ADMIN") {
    redirect("/app")
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
