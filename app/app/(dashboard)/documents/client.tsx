"use client"

import React, { useState, useEffect } from "react"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export function DocumentsClient() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/documents")
      if (res.ok) {
        setDocuments(await res.json())
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDocs()
  }, [])

  const handleVerify = async (id: string, status: string, reason?: string) => {
    try {
      const res = await fetch(`/api/documents/${id}/verify`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason })
      })
      if (res.ok) {
        fetchDocs()
      } else {
        alert("Failed to update status")
      }
    } catch (e) {
      alert("Error updating status")
    }
  }

  const handleView = async (id: string) => {
    try {
      const res = await fetch(`/api/documents/${id}/view`)
      if (res.ok) {
        const data = await res.json()
        window.open(data.url, "_blank")
      } else {
        alert("Failed to view document")
      }
    } catch (e) {
      alert("Error viewing document")
    }
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin w-6 h-6 text-gray-400" /></div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {documents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-500 py-8">No documents found.</TableCell>
              </TableRow>
            ) : documents.map(doc => (
              <TableRow key={doc.id}>
                <TableCell>
                  <Link href={`/app/members/${doc.memberId}`} className="font-medium text-navy-900 hover:text-brand-600 transition-colors block">
                    {doc.member.name}
                  </Link>
                  <div className="text-xs text-gray-500 mt-0.5">{doc.member.memberNumber}</div>
                </TableCell>
                <TableCell>{doc.type}</TableCell>
                <TableCell>
                  <div className="text-sm">{new Date(doc.uploadedAt).toLocaleDateString()}</div>
                  <div className="text-xs text-gray-500">by {doc.uploadedBy.name}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={doc.status === 'VERIFIED' ? 'bg-green-50 text-green-700' : doc.status === 'REJECTED' ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-700'}>
                    {doc.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleView(doc.id)}>View</Button>
                  {doc.status !== 'VERIFIED' && (
                    <>
                      <Button variant="default" size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleVerify(doc.id, "VERIFIED")}>Verify</Button>
                      <Button variant="destructive" size="sm" onClick={() => {
                        const reason = prompt("Reason for rejection?")
                        if (reason) handleVerify(doc.id, "REJECTED", reason)
                      }}>Reject</Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
