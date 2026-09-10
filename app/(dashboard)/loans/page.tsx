"use client"

import { useState } from "react"
import Link from "next/link"
import { mockLoans, mockMembers, mockLoanProducts } from "@/lib/mock-data"
import { Loan } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle2, XCircle, FileText, Plus } from "lucide-react"

export default function VerificationQueuePage() {
  const [loans, setLoans] = useState<Loan[]>(mockLoans)
  
  const pendingLoans = loans.filter(l => l.verificationStatus === "PENDING")

  const handleVerify = (id: string, note: string) => {
    setLoans(loans.map(l => l.id === id ? { ...l, verificationStatus: "VERIFIED", status: "ACTIVE", verificationNote: note } : l))
  }

  const handleReject = (id: string, note: string) => {
    setLoans(loans.map(l => l.id === id ? { ...l, verificationStatus: "REJECTED", status: "CANCELLED", verificationNote: note } : l))
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Loan Verification Queue</h1>
          <p className="text-gray-500">Review and approve pending loan applications.</p>
        </div>
        <Link href="/loans/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Application
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Verification ({pendingLoans.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Borrower</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Note</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingLoans.map(loan => {
                const member = mockMembers.find(m => m.id === loan.memberId)
                const product = mockLoanProducts.find(p => p.id === loan.loanProductId)
                return (
                  <TableRow key={loan.id}>
                    <TableCell className="text-sm text-gray-500">
                      {loan.createdAt.toISOString().split('T')[0]}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">{member?.name}</div>
                      <div className="text-xs text-gray-500">{member?.memberNumber}</div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product?.name || loan.loanType}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      LKR {Number(loan.loanAmount).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500 max-w-[200px] truncate">
                      {loan.verificationNote || "-"}
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Link href={`/loans/${loan.id}`}>
                        <Button variant="ghost" size="icon" title="View details">
                          <FileText className="w-4 h-4 text-gray-500" />
                        </Button>
                      </Link>
                      <VerificationActionModal 
                        type="VERIFY" 
                        loan={loan} 
                        onConfirm={(note) => handleVerify(loan.id, note)} 
                      />
                      <VerificationActionModal 
                        type="REJECT" 
                        loan={loan} 
                        onConfirm={(note) => handleReject(loan.id, note)} 
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
              {pendingLoans.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                    No pending loans in the queue.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {/* Active & Historical List below (simplified) */}
      <Card>
        <CardHeader>
          <CardTitle>All Loans</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Borrower</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Outstanding</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loans.filter(l => l.verificationStatus !== "PENDING").map(loan => {
                const member = mockMembers.find(m => m.id === loan.memberId)
                const product = mockLoanProducts.find(p => p.id === loan.loanProductId)
                return (
                  <TableRow key={loan.id}>
                    <TableCell>
                      <Link href={`/loans/${loan.id}`} className="font-medium text-blue-600 hover:underline">
                        {member?.name}
                      </Link>
                    </TableCell>
                    <TableCell>{product?.name || loan.loanType}</TableCell>
                    <TableCell>LKR {Number(loan.loanAmount).toLocaleString()}</TableCell>
                    <TableCell>LKR {Number(loan.outstanding).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={loan.status === "ACTIVE" ? "default" : "outline"}
                             className={loan.status === "ACTIVE" ? "bg-green-100 text-green-800" : ""}>
                        {loan.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function VerificationActionModal({ type, loan, onConfirm }: { type: "VERIFY" | "REJECT", loan: Loan, onConfirm: (n: string) => void }) {
  const [note, setNote] = useState(loan.verificationNote || "")
  const isVerify = type === "VERIFY"
  
  return (
    <Dialog>
      <DialogTrigger>
        <div className={`inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground h-9 w-9 ${isVerify ? "text-green-600 hover:bg-green-50" : "text-red-600 hover:bg-red-50"}`}>
          {isVerify ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isVerify ? "Verify Loan" : "Reject Loan"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-gray-500">
            {isVerify ? "Are you sure you want to approve this loan for disbursement?" : "Provide a reason for rejecting this application."}
          </p>
          <Textarea 
            placeholder="Verification note (optional)" 
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
          <Button 
            className={`w-full ${isVerify ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
            onClick={() => onConfirm(note)}
          >
            {isVerify ? "Confirm & Activate" : "Reject Application"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
