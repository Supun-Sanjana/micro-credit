"use client"

import { useState } from "react"
import { mockLoans, mockCashFlows, mockCentres, mockMembers, mockGuarantors } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { Search } from "lucide-react"
import Link from "next/link"

export default function ReportsPage() {
  const [searchNic, setSearchNic] = useState("")
  const [searchedMember, setSearchedMember] = useState<any>(null)

  const handleSearch = () => {
    if (!searchNic) return
    const member = mockMembers.find(m => m.nic === searchNic)
    if (member) {
      const memberLoans = mockLoans.filter(l => l.memberId === member.id)
      const guarantorRecords = mockGuarantors.filter(g => g.memberId === member.id)
      setSearchedMember({ member, loans: memberLoans, guarantorRecords })
    } else {
      setSearchedMember("NOT_FOUND")
    }
  }

  // Calculate Outstanding by Centre
  const outstandingByCentre = mockCentres.map(c => {
    const centreMembers = mockMembers.filter(m => m.centreId === c.id).map(m => m.id)
    const centreLoans = mockLoans.filter(l => centreMembers.includes(l.memberId) && l.status === "ACTIVE")
    const totalOutstanding = centreLoans.reduce((acc, l) => acc + Number(l.outstanding), 0)
    return { centre: c, activeLoans: centreLoans.length, totalOutstanding }
  }).filter(c => c.activeLoans > 0)

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Reports & Reconciliation</h1>
        <p className="text-gray-500">System overview, cash flow, and risk exposure.</p>
      </div>

      <Tabs defaultValue="reconciliation">
        <TabsList className="w-full md:w-auto grid grid-cols-2 md:flex overflow-x-auto h-auto">
          <TabsTrigger value="reconciliation" className="py-2">Daily Reconciliation</TabsTrigger>
          <TabsTrigger value="outstanding" className="py-2">Outstanding by Centre</TabsTrigger>
          <TabsTrigger value="member-search" className="py-2">Member History</TabsTrigger>
          <TabsTrigger value="exposure" className="py-2">Guarantor Exposure</TabsTrigger>
        </TabsList>

        <TabsContent value="reconciliation" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Reconciliation</CardTitle>
              <CardDescription>Recorded system collections vs entered physical cash flow.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Centre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">System Recorded</TableHead>
                    <TableHead className="text-right">Cash Entered</TableHead>
                    <TableHead className="text-right">Variance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockCashFlows.map(cf => {
                    // In a real app, "System Recorded" comes from summing `mockRepayments` for that date/centre.
                    // Here we just mock a 0 variance.
                    const systemRecorded = Number(cf.recoveryAmount)
                    const cashEntered = Number(cf.recoveryAmount)
                    const variance = cashEntered - systemRecorded

                    return (
                      <TableRow key={cf.id}>
                        <TableCell>{format(cf.date, "yyyy-MM-dd")}</TableCell>
                        <TableCell className="font-medium">{cf.centreName}</TableCell>
                        <TableCell>{cf.loanType}</TableCell>
                        <TableCell className="text-right font-medium">LKR {systemRecorded.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-blue-600 font-medium">LKR {cashEntered.toLocaleString()}</TableCell>
                        <TableCell className={`text-right font-bold ${variance < 0 ? "text-red-600" : variance > 0 ? "text-yellow-600" : "text-green-600"}`}>
                          {variance === 0 ? "-" : `LKR ${variance.toLocaleString()}`}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {mockCashFlows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-gray-500 py-6">No cash flow records found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outstanding" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Outstanding by Centre</CardTitle>
              <CardDescription>Aggregated outstanding balances grouped by centre.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch</TableHead>
                    <TableHead>Centre Code</TableHead>
                    <TableHead>Centre Name</TableHead>
                    <TableHead className="text-center">Active Loans</TableHead>
                    <TableHead className="text-right">Total Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outstandingByCentre.map(row => (
                    <TableRow key={row.centre.id}>
                      <TableCell className="text-gray-500">{row.centre.branchId}</TableCell>
                      <TableCell className="font-mono text-sm">{row.centre.centreCode}</TableCell>
                      <TableCell className="font-medium">{row.centre.name}</TableCell>
                      <TableCell className="text-center">{row.activeLoans}</TableCell>
                      <TableCell className="text-right font-bold">LKR {row.totalOutstanding.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                  {outstandingByCentre.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-gray-500 py-6">No active loans found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="member-search" className="pt-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Member History Search</CardTitle>
              <CardDescription>Search a member by NIC to see their full loan and guarantor history.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 max-w-md">
                <Input 
                  placeholder="Enter NIC number..." 
                  value={searchNic}
                  onChange={(e) => setSearchNic(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch}>
                  <Search className="w-4 h-4 mr-2" /> Search
                </Button>
              </div>
            </CardContent>
          </Card>

          {searchedMember === "NOT_FOUND" && (
            <div className="p-8 text-center bg-gray-50 border border-dashed rounded-xl text-gray-500">
              No member found with NIC "{searchNic}".
            </div>
          )}

          {searchedMember && searchedMember !== "NOT_FOUND" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Member Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Name</span>
                    <span className="font-medium">{searchedMember.member.name}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Member No.</span>
                    <span className="font-mono">{searchedMember.member.memberNumber}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">NIC</span>
                    <span>{searchedMember.member.nic}</span>
                  </div>
                  <div className="pt-2">
                    <Link href={`/members/${searchedMember.member.id}`}>
                      <Button variant="outline" className="w-full">View Full Profile</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Loan Summary ({searchedMember.loans.length})</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {searchedMember.loans.map((l: any) => (
                    <div key={l.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-blue-600 hover:underline">
                          <Link href={`/loans/${l.id}`}>{l.loanType} - LKR {Number(l.loanAmount).toLocaleString()}</Link>
                        </div>
                        <div className="text-xs text-gray-500">{l.status}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-500">Outstanding</div>
                        <div className="font-bold">LKR {Number(l.outstanding).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                  {searchedMember.loans.length === 0 && <div className="text-sm text-gray-500">No loans found.</div>}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="exposure" className="pt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Guarantor Exposure</CardTitle>
              <CardDescription>List of guarantors and the total outstanding balance they are backing.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Guarantor Name</TableHead>
                    <TableHead>NIC</TableHead>
                    <TableHead>Loans Backed</TableHead>
                    <TableHead className="text-right">Total Exposure</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Simplistic mock reduction for UI purposes */}
                  {mockGuarantors.map(g => {
                    const linkedLoan = mockLoans.find(l => l.id === g.loanId)
                    if (!linkedLoan || linkedLoan.status !== "ACTIVE") return null
                    return (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">{g.name}</TableCell>
                        <TableCell className="text-gray-500">{g.nic}</TableCell>
                        <TableCell>
                          <Link href={`/loans/${linkedLoan.id}`} className="text-blue-600 hover:underline">1 Active Loan</Link>
                        </TableCell>
                        <TableCell className="text-right font-bold text-red-600">
                          LKR {Number(linkedLoan.outstanding).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {mockGuarantors.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500 py-6">No active guarantors found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}
