"use client"

import { useParams } from "next/navigation"
import { mockLoans, mockMembers, mockLoanProducts, mockRepayments, mockGuarantors } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { format } from "date-fns"
import { User, Calendar, DollarSign, ShieldCheck } from "lucide-react"

export default function LoanDetailPage() {
  const params = useParams()
  const loanId = params.id as string

  const loan = mockLoans.find(l => l.id === loanId)
  if (!loan) return <div className="p-8 text-center text-gray-500">Loan not found</div>

  const member = mockMembers.find(m => m.id === loan.memberId)
  const product = mockLoanProducts.find(p => p.id === loan.loanProductId)
  const repayments = mockRepayments.filter(r => r.loanId === loanId)
  const guarantors = mockGuarantors.filter(g => g.loanId === loanId)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Loan {loan.loanNumber ? `#${loan.loanNumber}` : "Details"}
          </h1>
          <p className="text-gray-500">{member?.name} ({member?.memberNumber})</p>
        </div>
        <Badge 
          variant={loan.status === "ACTIVE" ? "default" : loan.status === "SETTLED" ? "secondary" : "outline"} 
          className={`px-3 py-1 text-sm ${loan.status === "ACTIVE" ? "bg-green-100 text-green-800" : ""}`}
        >
          {loan.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        
        {/* Left Col - Summary Cards */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-medium">Principal Amount</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">LKR {Number(loan.loanAmount).toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">{product?.name || loan.loanType}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-medium">Outstanding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">LKR {Number(loan.outstanding).toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-1">Paid: LKR {Number(loan.totalPaid).toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <div className="text-gray-500">Granted</div>
                <div className="font-medium">{loan.grantedDate ? format(loan.grantedDate, "PPP") : "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Expected Expiry</div>
                <div className="font-medium">{loan.expireDate ? format(loan.expireDate, "PPP") : "-"}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-gray-500 font-medium flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Guarantors
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {guarantors.map(g => (
                <div key={g.id} className="text-sm">
                  <div className="font-medium">{g.name}</div>
                  <div className="text-gray-500 text-xs">{g.nic} • {g.relationship}</div>
                  <div className="text-gray-500 text-xs">{g.contact}</div>
                </div>
              ))}
              {guarantors.length === 0 && <div className="text-sm text-gray-500">No guarantors recorded.</div>}
            </CardContent>
          </Card>
        </div>

        {/* Right Col - Repayment History */}
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Repayment History</CardTitle>
              <CardDescription>All recorded collections for this loan.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No.</TableHead>
                    <TableHead>Scheduled Date</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {repayments.map((r, idx) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.instalmentNumber || idx + 1}</TableCell>
                      <TableCell>{r.scheduledDate ? format(r.scheduledDate, "PP") : "-"}</TableCell>
                      <TableCell className="font-medium">{format(r.paidDate, "PP")}</TableCell>
                      <TableCell className="font-bold text-green-600">LKR {Number(r.amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">{r.method}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-gray-500">{r.note || "-"}</TableCell>
                    </TableRow>
                  ))}
                  {repayments.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-12">
                        No repayments recorded yet.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  )
}
