"use client"

import { useState } from "react"
import { mockLoans, mockCashFlows, mockCentres, mockMembers, mockGuarantors } from "@/lib/mock-data"
import { format } from "date-fns"
import Link from "next/link"

type Tab = "reconciliation" | "outstanding" | "member-search" | "exposure"

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("reconciliation")
  const [searchNic, setSearchNic] = useState("")
  const [searchedMember, setSearchedMember] = useState<any>(null)

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
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
    <div className="flex flex-col gap-[80px]">
      
      {/* Hero Section */}
      <div className="flex flex-col gap-4">
        <h1 
          className="text-[44px] leading-[1.3] text-ink-black font-serif font-normal"
          style={{ letterSpacing: '-0.66px' }}
        >
          Reports & Reconciliation
        </h1>
        <p className="text-[17px] text-slate-gray max-w-[600px] leading-[1.35]">
          System overview, cash flow validation, and portfolio risk exposure.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-col gap-[40px]">
        
        <div className="flex flex-wrap items-center gap-4 border-b border-border/40 pb-4">
          <TabButton active={activeTab === "reconciliation"} onClick={() => setActiveTab("reconciliation")}>
            Daily Reconciliation
          </TabButton>
          <TabButton active={activeTab === "outstanding"} onClick={() => setActiveTab("outstanding")}>
            Outstanding by Centre
          </TabButton>
          <TabButton active={activeTab === "member-search"} onClick={() => setActiveTab("member-search")}>
            Member History
          </TabButton>
          <TabButton active={activeTab === "exposure"} onClick={() => setActiveTab("exposure")}>
            Guarantor Exposure
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="w-full">
          
          {activeTab === "reconciliation" && (
            <div className="bg-mist-gray rounded-[24px] p-[32px] md:p-[40px]">
              <h2 className="text-[20px] font-sans font-medium text-ink-black mb-6">Recorded Collections vs Physical Cash</h2>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Date</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Centre</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Type</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-right">System</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-right">Cash Entered</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-right">Variance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockCashFlows.map(cf => {
                      const systemRecorded = Number(cf.recoveryAmount)
                      const cashEntered = Number(cf.recoveryAmount)
                      const variance = cashEntered - systemRecorded
                      return (
                        <tr key={cf.id} className="border-b border-border/40 last:border-0">
                          <td className="py-5 pr-4 text-[16px] font-sans text-ink-black">{format(cf.date, "yyyy-MM-dd")}</td>
                          <td className="py-5 pr-4 text-[16px] font-sans text-ink-black font-medium">{cf.centreName}</td>
                          <td className="py-5 pr-4 text-[16px] font-sans text-slate-gray">{cf.loanType}</td>
                          <td className="py-5 pr-4 text-[16px] font-sans text-slate-gray text-right">LKR {systemRecorded.toLocaleString()}</td>
                          <td className="py-5 pr-4 text-[16px] font-sans text-ink-black text-right">LKR {cashEntered.toLocaleString()}</td>
                          <td className={`py-5 pl-4 text-[16px] font-sans text-right ${variance < 0 ? "text-sienna-brown" : "text-slate-gray"}`}>
                            {variance === 0 ? "—" : `LKR ${variance.toLocaleString()}`}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "outstanding" && (
            <div className="bg-mist-gray rounded-[24px] p-[32px] md:p-[40px]">
              <h2 className="text-[20px] font-sans font-medium text-ink-black mb-6">Aggregated Outstanding Balances</h2>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Branch</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Centre Code</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Centre Name</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-center">Active Loans</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-right">Total Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstandingByCentre.map(row => (
                      <tr key={row.centre.id} className="border-b border-border/40 last:border-0">
                        <td className="py-5 pr-4 text-[16px] font-sans text-slate-gray">{row.centre.branchId}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-ink-black">{row.centre.centreCode}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-ink-black font-medium">{row.centre.name}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-ink-black text-center">{row.activeLoans}</td>
                        <td className="py-5 pl-4 text-[16px] font-sans text-ink-black text-right">LKR {row.totalOutstanding.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "member-search" && (
            <div className="flex flex-col gap-8">
              
              <div className="bg-paper-white rounded-[20px] shadow-subtle-3 p-[32px] max-w-[600px]">
                <h2 className="text-[20px] font-sans font-medium text-ink-black mb-4">Member Search</h2>
                <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
                  <input 
                    placeholder="Enter NIC number..." 
                    value={searchNic}
                    onChange={(e) => setSearchNic(e.target.value)}
                    className="flex-1 bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black"
                  />
                  <button 
                    type="submit"
                    className="flex items-center justify-center bg-ink-black text-paper-white rounded-full px-[24px] py-[14px] text-[16px] font-sans transition-opacity hover:opacity-90 whitespace-nowrap"
                  >
                    Search
                  </button>
                </form>
              </div>

              {searchedMember === "NOT_FOUND" && (
                <div className="text-center py-12 text-[15px] text-slate-gray bg-mist-gray rounded-[24px]">
                  No member found with NIC "{searchNic}".
                </div>
              )}

              {searchedMember && searchedMember !== "NOT_FOUND" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-mist-gray rounded-[24px] p-[32px]">
                    <h3 className="text-[20px] font-sans font-medium text-ink-black mb-6">Member Profile</h3>
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between border-b border-border/40 pb-3">
                        <span className="text-[15px] text-slate-gray">Name</span>
                        <span className="text-[16px] text-ink-black font-medium">{searchedMember.member.name}</span>
                      </div>
                      <div className="flex justify-between border-b border-border/40 pb-3">
                        <span className="text-[15px] text-slate-gray">Member No.</span>
                        <span className="text-[16px] text-ink-black">{searchedMember.member.memberNumber}</span>
                      </div>
                      <div className="flex justify-between border-b border-border/40 pb-3">
                        <span className="text-[15px] text-slate-gray">NIC</span>
                        <span className="text-[16px] text-ink-black">{searchedMember.member.nic}</span>
                      </div>
                      <Link 
                        href={`/members/${searchedMember.member.id}`}
                        className="mt-2 flex items-center justify-center border border-ink-black text-ink-black rounded-full px-[20px] py-[12px] text-[15px] font-sans transition-opacity hover:bg-ink-black hover:text-paper-white"
                      >
                        View Full Profile
                      </Link>
                    </div>
                  </div>

                  <div className="bg-mist-gray rounded-[24px] p-[32px]">
                    <h3 className="text-[20px] font-sans font-medium text-ink-black mb-6">Active Facilities</h3>
                    <div className="flex flex-col gap-4">
                      {searchedMember.loans.map((l: any) => (
                        <div key={l.id} className="flex justify-between items-center border-b border-border/40 pb-4 last:border-0 last:pb-0">
                          <div className="flex flex-col gap-1">
                            <Link href={`/loans/${l.id}`} className="text-[16px] text-ink-black font-medium hover:underline underline-offset-4">
                              {l.loanType} - LKR {Number(l.loanAmount).toLocaleString()}
                            </Link>
                            <span className="text-[14px] text-ash-gray uppercase tracking-wider">{l.status}</span>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-[14px] text-slate-gray">Outstanding</span>
                            <span className="text-[16px] text-ink-black font-medium">LKR {Number(l.outstanding).toLocaleString()}</span>
                          </div>
                        </div>
                      ))}
                      {searchedMember.loans.length === 0 && (
                        <div className="text-[15px] text-slate-gray">No loans found.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "exposure" && (
            <div className="bg-mist-gray rounded-[24px] p-[32px] md:p-[40px]">
              <h2 className="text-[20px] font-sans font-medium text-ink-black mb-6">Cross-Guarantor Risk</h2>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Guarantor Name</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">NIC</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Loans Backed</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-right">Total Exposure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockGuarantors.map(g => {
                      const linkedLoan = mockLoans.find(l => l.id === g.loanId)
                      if (!linkedLoan || linkedLoan.status !== "ACTIVE") return null
                      return (
                        <tr key={g.id} className="border-b border-border/40 last:border-0">
                          <td className="py-5 pr-4 text-[16px] font-sans text-ink-black font-medium">{g.name}</td>
                          <td className="py-5 pr-4 text-[16px] font-sans text-slate-gray">{g.nic}</td>
                          <td className="py-5 pr-4">
                            <Link href={`/loans/${linkedLoan.id}`} className="text-[16px] text-ink-black hover:underline underline-offset-4">
                              1 Active Loan
                            </Link>
                          </td>
                          <td className="py-5 pl-4 text-[16px] font-sans text-sienna-brown font-medium text-right">
                            LKR {Number(linkedLoan.outstanding).toLocaleString()}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

function TabButton({ active, onClick, children }: { active: boolean, onClick: () => void, children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-[20px] py-[10px] rounded-full text-[15px] font-sans transition-colors ${
        active 
          ? "bg-ink-black text-paper-white font-medium" 
          : "bg-transparent text-slate-gray hover:bg-mist-gray hover:text-ink-black"
      }`}
    >
      {children}
    </button>
  )
}
