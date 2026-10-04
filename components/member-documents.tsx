"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import {
  Camera,
  FileText,
  FileIcon,
  Upload,
  CheckCircle2,
  ExternalLink,
  AlertCircle,
  Loader2,
  X,
  FileCheck,
  Check,
  ZapIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export type MemberDocumentType = "NIC_PHOTO" | "BANK_BOOK" | "PAYSLIP" | "LOAN_APPLICATION" | "OTHER"
export type DocumentStatus = "PENDING" | "VERIFIED" | "REJECTED" | "ARCHIVED"

export interface MemberDocumentItem {
  id: string
  organizationId: string
  memberId: string
  type: MemberDocumentType
  status: DocumentStatus
  fileName: string
  mimeType: string
  fileSize: number
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
  { type: "LOAN_APPLICATION", label: "Loan App", icon: FileText },
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

/**
 * Compress an image file using canvas so it fits within `limitBytes`.
 * Tries JPEG quality levels 0.85 → 0.70 → 0.55 → 0.40 → 0.25.
 * Returns a new File with the compressed data. Throws if none fit.
 */
async function compressImageToLimit(file: File, limitBytes: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const canvas = document.createElement("canvas")
      // Scale down if image is very large (> 2000px on longest side)
      const MAX_SIDE = 2000
      let { naturalWidth: w, naturalHeight: h } = img
      if (w > MAX_SIDE || h > MAX_SIDE) {
        const ratio = Math.min(MAX_SIDE / w, MAX_SIDE / h)
        w = Math.round(w * ratio)
        h = Math.round(h * ratio)
      }
      canvas.width = w
      canvas.height = h
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, w, h)

      const qualities = [0.85, 0.70, 0.55, 0.40, 0.25]
      const tryNext = (idx: number) => {
        if (idx >= qualities.length) {
          reject(new Error("Could not compress image below 1 MB"))
          return
        }
        canvas.toBlob(
          (blob) => {
            if (!blob) { reject(new Error("Canvas toBlob failed")); return }
            if (blob.size <= limitBytes || idx === qualities.length - 1) {
              const compressed = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, ".jpg"),
                { type: "image/jpeg" }
              )
              resolve(compressed)
            } else {
              tryNext(idx + 1)
            }
          },
          "image/jpeg",
          qualities[idx]
        )
      }
      tryNext(0)
    }
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error("Failed to load image for compression"))
    }
    img.src = objectUrl
  })
}

export function MemberDocuments({ memberId }: MemberDocumentsProps) {
  const [documents, setDocuments] = useState<MemberDocumentItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [selectedType, setSelectedType] = useState<MemberDocumentType>("NIC_PHOTO")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  /** File awaiting user compression decision (image > 1 MB) */
  const [compressOffer, setCompressOffer] = useState<File | null>(null)
  const [isCompressing, setIsCompressing] = useState<boolean>(false)

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
      setDocuments(Array.isArray(data) ? data : data.documents || [])
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

  const MAX_FILE_BYTES = 1 * 1024 * 1024 // 1 MB per document

  const applyPreview = (file: File) => {
    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null)
    setUploadSuccess(null)
    setCompressOffer(null)
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      setUploadError("Invalid file type. Allowed: JPEG, PNG, WEBP, PDF.")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    if (file.size > MAX_FILE_BYTES) {
      if (file.type === "application/pdf") {
        // PDFs can't be losslessly compressed in the browser — instruct user
        setUploadError(
          `This PDF is ${(file.size / 1024 / 1024).toFixed(1)} MB. Maximum per file is 1 MB. ` +
          `Please compress it using a tool like ilovepdf.com or Adobe Acrobat before uploading.`
        )
        if (fileInputRef.current) fileInputRef.current.value = ""
        return
      }
      // For images, offer auto-compression
      setCompressOffer(file)
      applyPreview(file)
      return
    }

    setSelectedFile(file)
    applyPreview(file)
  }

  /** Compress an image using canvas until it's under 1 MB, then accept it */
  const handleCompressAndAccept = async () => {
    if (!compressOffer) return
    setIsCompressing(true)
    setUploadError(null)
    try {
      const compressed = await compressImageToLimit(compressOffer, MAX_FILE_BYTES)
      setCompressOffer(null)
      setSelectedFile(compressed)
      applyPreview(compressed)
    } catch {
      setUploadError("Auto-compression failed. Please manually reduce the file size below 1 MB.")
      setCompressOffer(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } finally {
      setIsCompressing(false)
    }
  }

  const handleClearSelectedFile = () => {
    setSelectedFile(null)
    setCompressOffer(null)
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

  const handleView = async (documentId: string) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/view`)
      if (!res.ok) throw new Error("Failed to get signed URL")
      const data = await res.json()
      window.open(data.url, '_blank')
    } catch (err: any) {
      alert(err.message || "Failed to view document")
    }
  }

  const hasUploadedType = (type: MemberDocumentType) => {
    return documents.some((doc) => doc.type === type)
  }

  return (
    <div className="space-y-6">
      {/* Upload Section with Type Tabs */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold text-navy-900 mb-4">
          Upload Member Document
        </h3>

        {/* Document Type Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {DOCUMENT_TYPES.map(({ type, label, icon: Icon }) => {
            const isUploaded = hasUploadedType(type)
            const isSelected = selectedType === type

            return (
              <button
                key={type}
                type="button"
                onClick={() => {
                  if (selectedType !== type) {
                    handleClearSelectedFile()
                  }
                  setSelectedType(type)
                  setUploadError(null)
                  setUploadSuccess(null)
                }}
                className={`relative flex flex-col items-start justify-between p-3.5 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "border-navy-900 bg-slate-50/40 ring-1 ring-navy-900/20"
                    : "border-[#e5e7eb] hover:border-slate-500/40 bg-white"
                }`}
              >
                <div className="flex items-center gap-2 mb-2 w-full">
                  <Icon
                    className={`w-4 h-4 ${
                      isSelected ? "text-navy-900" : "text-slate-500"
                    }`}
                  />
                  <span
                    className={`text-sm font-medium leading-none ${
                      isSelected ? "text-navy-900" : "text-slate-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>

                {isUploaded ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <Check className="w-3 h-3" /> Uploaded ✓
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-500/80">
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
        {!selectedFile && !compressOffer ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#d1d5db] hover:border-slate-500/60 rounded-xl p-6 text-center cursor-pointer transition-colors bg-[#fafafa] hover:bg-white"
          >
            <div className="mx-auto w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-navy-900 mb-1">
              Select or capture a{" "}
              {DOCUMENT_TYPES.find((t) => t.type === selectedType)?.label}
            </p>
            <p className="text-xs text-slate-500 mb-3">
              Camera capture supported on mobile · Max <strong>1 MB</strong> per file (JPEG, PNG, WEBP, PDF)
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
        ) : compressOffer ? (
          /* ── Compression offer banner ── */
          <div className="border border-amber-200 rounded-xl p-4 bg-amber-50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    loading="lazy"
                    decoding="async"
                    className="w-14 h-14 object-cover rounded-lg border border-amber-200 shadow-sm bg-white"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-lg border border-amber-200 bg-amber-100 flex items-center justify-center">
                    <ZapIcon className="w-6 h-6 text-amber-600" />
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-amber-900">
                    Image too large ({formatBytes(compressOffer.size)})
                  </p>
                  <p className="text-xs text-amber-700 mt-0.5 max-w-sm">
                    This image exceeds the 1 MB limit. We can automatically compress it for you — image content will remain readable but file quality may reduce slightly.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearSelectedFile}
                  disabled={isCompressing}
                  className="text-amber-700 hover:text-amber-900"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleCompressAndAccept}
                  disabled={isCompressing}
                  className="bg-amber-600 text-white hover:bg-amber-700 min-w-[130px]"
                >
                  {isCompressing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Compressing...
                    </>
                  ) : (
                    <>
                      <ZapIcon className="w-3.5 h-3.5 mr-1.5" />
                      Auto-Compress & Use
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-[#e5e7eb] rounded-xl p-4 bg-[#fafafa]">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    loading="lazy"
                    decoding="async"
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
                    <p className="text-sm font-medium text-navy-900 max-w-xs sm:max-w-md truncate">
                      {selectedFile!.name}
                    </p>
                    <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                      {DOCUMENT_TYPES.find((t) => t.type === selectedType)?.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {formatBytes(selectedFile!.size)} • {selectedFile!.type || "Document"}
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
                  className="text-slate-500 hover:text-navy-900"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="bg-navy-900 text-white hover:bg-navy-900/90 min-w-[100px]"
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
          <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
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
            <h3 className="text-base font-semibold text-navy-900">
              Uploaded Documents
            </h3>
            <span className="text-xs bg-slate-50 text-slate-500 px-2 py-0.5 rounded-full font-medium">
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
          <div className="py-12 flex flex-col items-center justify-center text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin mb-2" />
            <p className="text-sm">Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-10 text-center border border-dashed border-[#e5e7eb] rounded-lg">
            <FileCheck className="w-8 h-8 text-slate-500/50 mx-auto mb-2" />
            <p className="text-sm font-medium text-slate-500">
              No documents uploaded yet for this member.
            </p>
            <p className="text-xs text-slate-500/80 mt-1">
              Upload NIC photos, payslips, or bank book copies above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-[#ececec] border border-[#ececec] rounded-lg overflow-hidden">
            {documents.map((doc) => {
              const filename = doc.fileName || "document"
              const typeInfo = DOCUMENT_TYPES.find((t) => t.type === doc.type)
              const TypeIcon = typeInfo?.icon || FileIcon

              return (
                <div
                  key={doc.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-[#fafafa] transition-colors gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Metadata */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant="secondary"
                          className="text-[11px] font-medium bg-slate-50 text-navy-900 flex items-center gap-1 py-0 px-2"
                        >
                          <TypeIcon className="w-3 h-3 text-slate-500" />
                          {typeInfo?.label || doc.type}
                        </Badge>
                        <Badge
                          variant="outline"
                          className={`text-[11px] ${doc.status === 'VERIFIED' ? 'bg-green-50 text-green-700' : doc.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}`}
                        >
                          {doc.status}
                        </Badge>
                        <span className="text-sm font-medium text-navy-900 truncate max-w-[220px] sm:max-w-xs md:max-w-md">
                          {filename}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>{formatBytes(doc.fileSize)}</span>
                        <span>•</span>
                        <span>{formatDate(doc.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: View */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleView(doc.id)}
                      className="h-8 px-2.5 text-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                      View
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
