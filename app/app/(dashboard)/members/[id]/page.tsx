"use client"

import { useParams } from "next/navigation"
import { mockMembers, mockCentres, mockLoans, mockGuarantors } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { User, Phone, MapPin, Hash, ShieldCheck } from "lucide-react"
import { MemberDocuments } from "@/components/member-documents"

export default function MemberDetailPage() {
  const params = useParams()
  const memberId = params.id as string

  const member = mockMembers.find(m => m.id === memberId)
  const centre = mockCentres.find(c => c.id === member?.centreId)
  
  const loans = mockLoans.filter(l => l.memberId === memberId)
  const guarantorFor = mockGuarantors.filter(g => g.memberId === memberId)

  if (!member) {
    return <div className="p-8 text-center text-gray-500">Member not found</div>
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">{member.name}</h1>
          <p className="text-gray-500">{member.memberNumber} • {centre?.name}</p>
        </div>
        <Badge variant="outline" className="px-3 py-1 text-sm bg-white">
          Group {member.groupNumber || "-"}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Details */}
        <Card className="md:col-span-1 h-fit">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5 text-gray-400" /> Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-1">
                <Hash className="w-4 h-4" /> NIC
              </div>
              <div className="text-gray-900">{member.nic || "Not provided"}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-1">
                <Phone className="w-4 h-4" /> Contact
              </div>
              <div className="text-gray-900">{member.contact1 || "-"}</div>
              {member.contact2 && <div className="text-gray-900 text-sm mt-1">{member.contact2}</div>}
            </div>
            <div>
              <div className="text-sm font-medium text-gray-500 flex items-center gap-2 mb-1">
                <MapPin className="w-4 h-4" /> Address
              </div>
              <div className="text-gray-900 whitespace-pre-wrap">{member.address || "No address on file"}</div>
            </div>
          </CardContent>
        </Card>

        {/* Loan & Guarantor History */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Loan History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No.</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium text-blue-600">
                        <a href={`/loans/${l.id}`} className="hover:underline">{l.loanNumber || "1ST"}</a>
                      </TableCell>
                      <TableCell>{l.loanType}</TableCell>
                      <TableCell>LKR {Number(l.loanAmount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={l.status === "ACTIVE" ? "default" : l.status === "SETTLED" ? "secondary" : "outline"} 
                               className={l.status === "ACTIVE" ? "bg-green-100 text-green-800 hover:bg-green-100" : ""}>
                          {l.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        LKR {Number(l.outstanding).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {loans.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-6">No loans found for this member.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-gray-400" /> Guarantor For
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Loan</TableHead>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Relationship</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {guarantorFor.map(g => {
                    const linkedLoan = mockLoans.find(l => l.id === g.loanId)
                    const borrower = mockMembers.find(m => m.id === linkedLoan?.memberId)
                    return (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium text-blue-600">
                          <a href={`/loans/${g.loanId}`} className="hover:underline">View Loan</a>
                        </TableCell>
                        <TableCell>{borrower?.name || "Unknown Borrower"}</TableCell>
                        <TableCell>{g.relationship}</TableCell>
                      </TableRow>
                    )
                  })}
                  {guarantorFor.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-6">Not acting as a guarantor.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Documents Section */}
      <section className="mt-8">
        <h2 className="text-[26px] font-serif font-normal text-ink-black tracking-[-0.23px] mb-6">
          Documents
        </h2>
        <MemberDocuments memberId={memberId} />
      </section>
    </div>
  )
}
