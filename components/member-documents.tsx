"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import {
  Camera,
  FileText,
  FileIcon,
  Upload,
  CheckCircle2,
  Trash2,
  ExternalLink,
  AlertCircle,
  Loader2,
  X,
  FileCheck,
  HardDrive,
  Check,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export type MemberDocumentType = "NIC_PHOTO" | "BANK_BOOK" | "PAYSLIP" | "OTHER"

export interface MemberDocumentItem {
  id: string
  organizationId: string
  memberId: string
  type: MemberDocumentType
  url: string
  sizeBytes: number
  uploadedAt: string
}

interface MemberDocumentsProps {
  memberId: string
}

const DOCUMENT_TYPES: {
  type: MemberDocumentType
  label: string
  icon: React.ComponentType<{ className?: string }>
}[] = [
  { type: "NIC_PHOTO", label: "NIC Photo", icon: Camera },
  { type: "BANK_BOOK", label: "Bank Book", icon: FileText },
  { type: "PAYSLIP", label: "Payslip", icon: FileText },
  { type: "OTHER", label: "Other", icon: FileIcon },
]

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  } catch {
    return dateStr
  }
}

export function MemberDocuments({ memberId }: MemberDocumentsProps) {
  const [documents, setDocuments] = useState<MemberDocumentItem[]>([])
  const [totalUsedBytes, setTotalUsedBytes] = useState<number>(0)
  const [quotaBytes, setQuotaBytes] = useState<number>(5000 * 1024 * 1024)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [selectedType, setSelectedType] = useState<MemberDocumentType>("NIC_PHOTO")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = useCallback(async () => {
    try {
      setIsLoading(true)
      setFetchError(null)
      const res = await fetch(`/api/members/${memberId}/documents`)
      if (!res.ok) {
        throw new Error(`Failed to load documents (${res.status})`)
      }
      const data = await res.json()
      setDocuments(data.documents || [])
      setTotalUsedBytes(data.totalUsedBytes || 0)
      if (data.quotaBytes) {
        setQuotaBytes(data.quotaBytes)
      }
    } catch (err: any) {
      console.error("Error fetching documents:", err)
      setFetchError(err.message || "Failed to load documents")
    } finally {
      setIsLoading(false)
    }
  }, [memberId])

  useEffect(() => {
    fetchDocuments()
  }, [fetchDocuments])

  // Clean up preview object URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    setUploadSuccess(null)
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Invalid file type. Allowed: JPEG, PNG, WEBP, PDF.")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File size exceeds 10MB limit.")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setSelectedFile(file)
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleClearSelectedFile = () => {
    setSelectedFile(null)
    if (previewUrl && previewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setUploadError(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError("Please select a file to upload.")
      return
    }

    setIsUploading(true)
    setUploadError(null)
    setUploadSuccess(null)

    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("type", selectedType)

      const res = await fetch(`/api/members/${memberId}/documents`, {
        method: "POST",
        body: formData,
      })

      const data = await res.json()

      if (!res.ok) {
        if (res.status === 413) {
          throw new Error("Storage quota exceeded. Please upgrade your storage plan.")
        }
        throw new Error(data.error || "Failed to upload document")
      }

      setUploadSuccess("Document uploaded successfully!")
      handleClearSelectedFile()
      await fetchDocuments()
    } catch (err: any) {
      console.error("Upload error:", err)
      setUploadError(err.message || "Failed to upload document")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (documentId: string) => {
    if (!confirm("Are you sure you want to delete this document?")) {
      return
    }

    setDeletingId(documentId)
    try {
      const res = await fetch(
        `/api/members/${memberId}/documents?documentId=${documentId}`,
        {
          method: "DELETE",
        }
      )

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to delete document")
      }

      // Refresh list after deletion
      await fetchDocuments()
    } catch (err: any) {
      alert(err.message || "Failed to delete document")
    } finally {
      setDeletingId(null)
    }
  }

  // Check if a document type is already uploaded
  const hasUploadedType = (type: MemberDocumentType) => {
    return documents.some((doc) => doc.type === type)
  }

  const percentageUsed = quotaBytes > 0
    ? Math.min(100, Math.round((totalUsedBytes / quotaBytes) * 100))
    : 0

  const isStorageNearFull = percentageUsed >= 80
  const isStorageFull = percentageUsed >= 95

  return (
    <div className="space-y-6">
      {/* Storage Quota Card */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-slate-gray" />
            <span className="text-sm font-medium text-ink-black">
              Storage Usage
            </span>
          </div>
          <span className="text-sm text-slate-gray font-mono">
            {formatBytes(totalUsedBytes)} / {formatBytes(quotaBytes)} used ({percentageUsed}%)
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#f3f4f6] h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 rounded-full ${
              isStorageFull
                ? "bg-red-500"
                : isStorageNearFull
                ? "bg-amber-500"
                : "bg-ink-black"
            }`}
            style={{ width: `${Math.max(2, percentageUsed)}%` }}
          />
        </div>

        {isStorageFull && (
          <p className="mt-2 text-xs text-red-600 flex items-center gap-1.5 font-medium">
            <AlertCircle className="w-3.5 h-3.5" />
            Storage quota is full. Delete old files or upgrade your subscription plan.
          </p>
        )}
      </div>

      {/* Upload Section with Type Tabs */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-ink-black mb-4">
          Upload Member Document
        </h3>

        {/* Document Type Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {DOCUMENT_TYPES.map(({ type, label, icon: Icon }) => {
            const isUploaded = hasUploadedType(type)
            const isSelected = selectedType === type

            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  setSelectedType(type)
                  setUploadError(null)
                  setUploadSuccess(null)
                }}
                className={`relative flex flex-col items-start justify-between p-3.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "border-ink-black bg-mist-gray/40 ring-1 ring-ink-black/20"
                    : "border-[#e5e7eb] hover:border-slate-gray/40 bg-white"
                }`}
              >
                <div className="flex items-center gap-2 mb-2 w-full">
                  <Icon
                    className={`w-4 h-4 ${
                      isSelected ? "text-ink-black" : "text-slate-gray"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium leading-none ${
                      isSelected ? "text-ink-black" : "text-slate-gray"
                    }`}
                  >
                    {label}
                  </span>
                </div>

                {/* Status indicator */}
                {isUploaded ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <Check className="w-3 h-3" /> Uploaded ✓
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-gray/80">
                    Not uploaded
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
          id="member-doc-file-upload"
        />

        {/* File Dropzone / Selection Box */}
        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#d1d5db] hover:border-slate-gray/60 rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#fafafa] hover:bg-white"
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-mist-gray flex items-center justify-center text-slate-gray mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-ink-black mb-1">
              Select or capture a{" "}
              {DOCUMENT_TYPES.find((t) => t.type === selectedType)?.label}
            </p>
            <p className="text-xs text-slate-gray mb-3">
              Direct camera capture supported on mobile. Max 10MB (JPEG, PNG, WEBP, PDF)
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                fileInputRef.current?.click()
              }}
            >
              <Camera className="w-3.5 h-3.5 mr-1.5" />
              Choose File or Photo
            </Button>
          </div>
        ) : (
          <div className="border border-[#e5e7eb] rounded-xl p-4 bg-[#fafafa]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-14 h-14 object-cover rounded-lg border border-[#e5e7eb] shadow-sm bg-white"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg border border-red-200 bg-red-50 flex flex-col items-center justify-center text-red-600 shadow-sm">
                    <FileText className="w-6 h-6" />
                    <span className="text-[9px] font-bold mt-0.5 uppercase">PDF</span>
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-ink-black max-w-xs sm:max-w-md truncate">
                      {selectedFile.name}
                    </p>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                      {DOCUMENT_TYPES.find((t) => t.type === selectedType)?.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-gray mt-0.5">
                    {formatBytes(selectedFile.size)} • {selectedFile.type || "Document"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelectedFile}
                  disabled={isUploading}
                  className="text-slate-gray hover:text-ink-black"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="bg-ink-black text-paper-white hover:bg-ink-black/90 min-w-[100px]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 mr-1.5" />
                      Upload
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Status Alerts */}
        {uploadError && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}
      </div>

      {/* Uploaded Documents List */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-ink-black">
              Uploaded Documents
            </h3>
            <span className="text-xs bg-mist-gray text-slate-gray px-2 py-0.5 rounded-full font-medium">
              {documents.length}
            </span>
          </div>
        </div>

        {fetchError && (
          <div className="p-3 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{fetchError}</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center text-slate-gray">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-sm">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-[#e5e7eb] rounded-lg">
            <FileCheck className="w-8 h-8 text-slate-gray/50 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-gray">
              No documents uploaded yet for this member.
            </p>
            <p className="text-xs text-slate-gray/80 mt-1">
              Upload NIC photos, payslips, or bank book copies above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#ececec] border border-[#ececec] rounded-lg overflow-hidden">
            {documents.map((doc) => {
              const filename = doc.url.split("/").pop() || "document"
              const isImage =
                doc.url.match(/\.(jpg|jpeg|png|webp)$/i) ||
                doc.type === "NIC_PHOTO"
              const typeInfo = DOCUMENT_TYPES.find((t) => t.type === doc.type)
              const TypeIcon = typeInfo?.icon || FileIcon
              const isDeleting = deletingId === doc.id

              return (
                <div
                  key={doc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-[#fafafa] transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Thumbnail */}
                    <div className="shrink-0">
                      {isImage ? (
                        <img
                          src={doc.url}
                          alt={filename}
                          className="w-12 h-12 object-cover rounded-md border border-[#e5e7eb] bg-mist-gray/30"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-md border border-red-200 bg-red-50 flex flex-col items-center justify-center text-red-600">
                          <FileText className="w-5 h-5" />
                          <span className="text-[8px] font-bold uppercase mt-0.5">PDF</span>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-medium bg-mist-gray text-ink-black flex items-center gap-1 py-0 px-2"
                        >
                          <TypeIcon className="w-3 h-3 text-slate-gray" />
                          {typeInfo?.label || doc.type}
                        </Badge>
                        <span className="text-sm font-medium text-ink-black truncate max-w-[220px] sm:max-w-xs md:max-w-md">
                          {filename}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-gray mt-1">
                        <span>{formatBytes(doc.sizeBytes)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: View and Delete */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-ink-black bg-white hover:bg-mist-gray border border-[#d1d5db] rounded-md transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      View
                    </a>

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      disabled={isDeleting}
                      className="h-8 px-2.5 text-xs"
                    >
                      {isDeleting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                      <span className="sr-only sm:not-sr-only sm:ml-1">Delete</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
