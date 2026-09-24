"use client"

import { useState, useEffect, useTransition } from "react"
import { format } from "date-fns"
import Link from "next/link"
import { 
  getPortfolioAtRisk, 
  getCollectionEfficiency, 
  getAgingReport, 
  getOutstandingByCentre, 
  getMemberHistory, 
  getDailyReconciliation 
} from "@/app/actions/reports"
import { Loader2 } from "lucide-react"

type Tab = "reconciliation" | "outstanding" | "member-search" | "par" | "efficiency" | "aging"

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("reconciliation")
  const [isPending, startTransition] = useTransition()
  
  // Tab Data States
  const [reconData, setReconData] = useState<any>(null)
  const [reconDate, setReconDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'))
  
  const [outstandingData, setOutstandingData] = useState<any[]>([])
  const [parData, setParData] = useState<any>(null)
  const [efficiencyData, setEfficiencyData] = useState<any[]>([])
  const [agingData, setAgingData] = useState<any[]>([])
  
  // Member Search State
  const [searchNic, setSearchNic] = useState("")
  const [searchedMember, setSearchedMember] = useState<any>(null)

  const loadTabData = (tab: Tab) => {
    startTransition(async () => {
      try {
        if (tab === "reconciliation") {
          const data = await getDailyReconciliation(reconDate)
          setReconData(data)
        } else if (tab === "outstanding") {
          const data = await getOutstandingByCentre()
          setOutstandingData(data)
        } else if (tab === "par") {
          const data = await getPortfolioAtRisk()
          setParData(data)
        } else if (tab === "efficiency") {
          const end = new Date()
          const start = new Date()
          start.setDate(start.getDate() - 30)
          const data = await getCollectionEfficiency(start.toISOString(), end.toISOString())
          setEfficiencyData(data)
        } else if (tab === "aging") {
          const data = await getAgingReport()
          setAgingData(data)
        }
      } catch (err) {
        console.error("Failed to load report data:", err)
      }
    })
  }

  useEffect(() => {
    if (activeTab !== "member-search") {
      loadTabData(activeTab)
    }
  }, [activeTab, reconDate])

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchNic) return
    startTransition(async () => {
      try {
        const member = await getMemberHistory(searchNic)
        setSearchedMember(member || "NOT_FOUND")
      } catch (err) {
        console.error(err)
      }
    })
  }

  return (
    <div className="flex flex-col gap-8 lg:gap-[48px]">
      
      {/* Hero Section */}
      <div className="flex flex-col gap-4">
        <h1 className="text-[44px] leading-[1.3] text-ink-black font-serif font-normal" style={{ letterSpacing: '-0.66px' }}>
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
          <TabButton active={activeTab === "par"} onClick={() => setActiveTab("par")}>
            Portfolio at Risk (PAR)
          </TabButton>
          <TabButton active={activeTab === "efficiency"} onClick={() => setActiveTab("efficiency")}>
            Collection Efficiency
          </TabButton>
          <TabButton active={activeTab === "aging"} onClick={() => setActiveTab("aging")}>
            Aging Report
          </TabButton>
          <TabButton active={activeTab === "member-search"} onClick={() => setActiveTab("member-search")}>
            Member History
          </TabButton>
        </div>

        {/* Loading Indicator */}
        {isPending && (
          <div className="flex items-center gap-2 text-slate-gray">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading report data...</span>
          </div>
        )}

        {/* Tab Content */}
        <div className="w-full">
          
          {activeTab === "reconciliation" && reconData && !isPending && (
            <div className="bg-mist-gray rounded-[24px] p-[32px] md:p-[40px]">
              <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                <h2 className="text-[20px] font-sans font-medium text-ink-black">Daily Collection vs Ledger Cash</h2>
                <input 
                  type="date"
                  value={reconDate}
                  onChange={e => setReconDate(e.target.value)}
                  className="bg-paper-white border border-[#ececec] rounded-xl px-4 py-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-paper-white p-6 rounded-xl border border-border/40">
                  <div className="text-[15px] text-slate-gray mb-1">Field Reported (CashFlows)</div>
                  <div className="text-[24px] font-medium text-ink-black mb-4">LKR {reconData.fieldReportedCollection.toLocaleString()}</div>
                  
                  <div className="text-[15px] text-slate-gray mb-1">Ledger Cash Debit (Journal 1000)</div>
                  <div className="text-[24px] font-medium text-ink-black">LKR {reconData.systemCashIn.toLocaleString()}</div>
                  
                  <div className={`mt-4 pt-4 border-t border-border/40 font-medium ${reconData.discrepancyCollection !== 0 ? 'text-sienna-brown' : 'text-[#137333]'}`}>
                    Variance: LKR {reconData.discrepancyCollection.toLocaleString()}
                  </div>
                </div>

                <div className="bg-paper-white p-6 rounded-xl border border-border/40">
                  <div className="text-[15px] text-slate-gray mb-1">Field Reported Disbursements</div>
                  <div className="text-[24px] font-medium text-ink-black mb-4">LKR {reconData.fieldReportedDisbursement.toLocaleString()}</div>
                  
                  <div className="text-[15px] text-slate-gray mb-1">Ledger Cash Credit (Journal 1000)</div>
                  <div className="text-[24px] font-medium text-ink-black">LKR {reconData.systemCashOut.toLocaleString()}</div>
                  
                  <div className={`mt-4 pt-4 border-t border-border/40 font-medium ${reconData.discrepancyDisbursement !== 0 ? 'text-sienna-brown' : 'text-[#137333]'}`}>
                    Variance: LKR {reconData.discrepancyDisbursement.toLocaleString()}
                  </div>
                </div>
              </div>

              <h3 className="text-[16px] font-medium text-ink-black mb-4">Field Submissions for {reconDate}</h3>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Centre</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Type</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-right">Target</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-right">Collected</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-right">Issued</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reconData.cashFlows.map((cf: any) => (
                      <tr key={cf.id} className="border-b border-border/40 last:border-0">
                        <td className="py-5 pr-4 text-[16px] font-sans text-ink-black font-medium">{cf.centreName}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-slate-gray">{cf.loanType}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-slate-gray text-right">LKR {Number(cf.totalRecovery).toLocaleString()}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-ink-black text-right">LKR {Number(cf.dcAmount).toLocaleString()}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-ink-black text-right">LKR {Number(cf.amountIssued).toLocaleString()}</td>
                      </tr>
                    ))}
                    {reconData.cashFlows.length === 0 && (
                      <tr><td colSpan={5} className="py-5 text-center text-slate-gray">No cashflows reported.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "outstanding" && outstandingData && !isPending && (
            <div className="bg-mist-gray rounded-[24px] p-[32px] md:p-[40px]">
              <h2 className="text-[20px] font-sans font-medium text-ink-black mb-6">Aggregated Outstanding Balances</h2>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Branch</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Centre</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-center">Active Loans</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-right">Total Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {outstandingData.map((d: any) => (
                      <tr key={d.centre.id} className="border-b border-border/40 last:border-0">
                        <td className="py-5 pr-4 text-[16px] font-sans text-slate-gray">{d.centre.branch.name}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-ink-black font-medium">{d.centre.name}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-center">{d.activeLoans}</td>
                        <td className="py-5 pl-4 text-[16px] font-sans text-ink-black text-right">LKR {d.totalOutstanding.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "par" && parData && !isPending && (
            <div className="bg-mist-gray rounded-[24px] p-[32px] md:p-[40px]">
              <h2 className="text-[20px] font-sans font-medium text-ink-black mb-6">Portfolio at Risk (PAR)</h2>
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-paper-white p-4 rounded-xl border border-border/40">
                    <div className="text-[14px] text-slate-gray">PAR 1+</div>
                    <div className="text-[20px] font-medium mt-1">LKR {parData.par1.toLocaleString()}</div>
                  </div>
                  <div className="bg-paper-white p-4 rounded-xl border border-border/40">
                    <div className="text-[14px] text-slate-gray">PAR 7+</div>
                    <div className="text-[20px] font-medium mt-1">LKR {parData.par7.toLocaleString()}</div>
                  </div>
                  <div className="bg-paper-white p-4 rounded-xl border border-border/40">
                    <div className="text-[14px] text-slate-gray">PAR 30+</div>
                    <div className="text-[20px] font-medium mt-1">LKR {parData.par30.toLocaleString()}</div>
                  </div>
                  <div className="bg-paper-white p-4 rounded-xl border border-border/40">
                    <div className="text-[14px] text-slate-gray">PAR 90+</div>
                    <div className="text-[20px] font-medium mt-1 text-sienna-brown">LKR {parData.par90.toLocaleString()}</div>
                  </div>
                </div>
                <div className="bg-paper-white p-6 rounded-xl border border-border/40">
                  <div className="text-[15px] text-slate-gray mb-2">Total Outstanding: LKR {parData.totalOutstanding.toLocaleString()}</div>
                  <div className="text-[15px] text-slate-gray">Total PAR: LKR {parData.parTotal.toLocaleString()} ({((parData.parTotal / (parData.totalOutstanding || 1)) * 100).toFixed(2)}%)</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "efficiency" && efficiencyData && !isPending && (
            <div className="bg-mist-gray rounded-[24px] p-[32px] md:p-[40px]">
              <h2 className="text-[20px] font-sans font-medium text-ink-black mb-6">Collection Efficiency (Last 30 Days)</h2>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Branch</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Centre</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-right">Expected</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-right">Collected</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-right">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {efficiencyData.map((d: any) => (
                      <tr key={d.centreName} className="border-b border-border/40 last:border-0">
                        <td className="py-5 pr-4 text-[16px] font-sans text-slate-gray">{d.branchName}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-ink-black font-medium">{d.centreName}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-slate-gray text-right">LKR {d.scheduled.toLocaleString()}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-ink-black text-right">LKR {d.collected.toLocaleString()}</td>
                        <td className="py-5 pl-4 text-[16px] font-sans font-medium text-right">
                          {d.efficiency.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                    {efficiencyData.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-5 text-center text-slate-gray">No data available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "aging" && agingData && !isPending && (
            <div className="bg-mist-gray rounded-[24px] p-[32px] md:p-[40px]">
              <h2 className="text-[20px] font-sans font-medium text-ink-black mb-6">Aging Report</h2>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Loan No</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Member</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-center">Days Past Due</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-right">Overdue Amount</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agingData.map((d: any) => (
                      <tr key={d.loanId} className="border-b border-border/40 last:border-0">
                        <td className="py-5 pr-4 text-[16px] font-sans text-ink-black font-medium">
                          <Link href={`/app/loans/${d.loanId}`} className="hover:underline">{d.loanNumber || d.loanId.slice(0,8)}</Link>
                        </td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-slate-gray">{d.memberName}</td>
                        <td className={`py-5 pr-4 text-[16px] font-sans text-center font-medium ${d.daysPastDue > 30 ? 'text-sienna-brown' : 'text-ink-black'}`}>
                          {d.daysPastDue}
                        </td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-sienna-brown text-right">LKR {d.overdueAmount.toLocaleString()}</td>
                        <td className="py-5 pl-4 text-[16px] font-sans text-slate-gray text-right">LKR {d.outstanding.toLocaleString()}</td>
                      </tr>
                    ))}
                    {agingData.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-5 text-center text-slate-gray">No overdue loans.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "member-search" && (
            <div className="bg-mist-gray rounded-[24px] p-[32px] md:p-[40px]">
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-8">
                <div>
                  <h2 className="text-[20px] font-sans font-medium text-ink-black mb-1">Member History</h2>
                  <p className="text-[15px] text-slate-gray">Search by NIC to view complete history</p>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                  <input
                    value={searchNic}
                    onChange={e => setSearchNic(e.target.value)}
                    placeholder="Enter NIC..."
                    className="bg-paper-white border border-[#ececec] rounded-xl px-4 py-2 flex-grow md:w-[250px] outline-none focus:border-ink-black"
                  />
                  <button 
                    disabled={isPending}
                    type="submit" 
                    className="bg-ink-black text-paper-white px-6 py-2 rounded-xl font-medium"
                  >
                    Search
                  </button>
                </form>
              </div>

              {searchedMember === "NOT_FOUND" && (
                <div className="p-4 bg-[#fce8e6] text-[#c5221f] rounded-xl font-medium">
                  Member with NIC {searchNic} not found.
                </div>
              )}

              {searchedMember && searchedMember !== "NOT_FOUND" && !isPending && (
                <div className="space-y-8">
                  <div className="bg-paper-white p-6 rounded-xl border border-border/40">
                    <h3 className="text-[18px] font-medium text-ink-black mb-4">{searchedMember.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[15px]">
                      <div>
                        <div className="text-slate-gray mb-1">NIC</div>
                        <div className="font-medium text-ink-black">{searchedMember.nic}</div>
                      </div>
                      <div>
                        <div className="text-slate-gray mb-1">Member No</div>
                        <div className="font-medium text-ink-black">{searchedMember.memberNumber}</div>
                      </div>
                      <div>
                        <div className="text-slate-gray mb-1">Centre</div>
                        <div className="font-medium text-ink-black">{searchedMember.centre?.name}</div>
                      </div>
                      <div>
                        <div className="text-slate-gray mb-1">Contact</div>
                        <div className="font-medium text-ink-black">{searchedMember.contact1 || "N/A"}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[16px] font-medium text-ink-black mb-4">Loan History</h3>
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse bg-paper-white rounded-xl border border-border/40 overflow-hidden">
                        <thead>
                          <tr className="border-b border-border/40 bg-mist-gray/30">
                            <th className="p-4 font-sans text-[14px] text-slate-gray font-normal">Loan No</th>
                            <th className="p-4 font-sans text-[14px] text-slate-gray font-normal">Granted</th>
                            <th className="p-4 font-sans text-[14px] text-slate-gray font-normal text-right">Amount</th>
                            <th className="p-4 font-sans text-[14px] text-slate-gray font-normal">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchedMember.loans?.map((l: any) => (
                            <tr key={l.id} className="border-b border-border/40 last:border-0">
                              <td className="p-4 text-[15px] font-medium text-ink-black">
                                <Link href={`/app/loans/${l.id}`} className="hover:underline">{l.loanNumber || l.id.slice(0,8)}</Link>
                              </td>
                              <td className="p-4 text-[15px] text-slate-gray">{format(new Date(l.grantedDate), "yyyy-MM-dd")}</td>
                              <td className="p-4 text-[15px] text-ink-black text-right">LKR {Number(l.loanAmount).toLocaleString()}</td>
                              <td className="p-4 text-[15px]">
                                <span className="px-2.5 py-1 rounded-full text-[12px] font-medium bg-mist-gray">{l.status}</span>
                              </td>
                            </tr>
                          ))}
                          {(!searchedMember.loans || searchedMember.loans.length === 0) && (
                            <tr><td colSpan={4} className="p-4 text-center text-slate-gray">No loans found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[16px] font-medium text-ink-black mb-4">Savings Accounts</h3>
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse bg-paper-white rounded-xl border border-border/40 overflow-hidden">
                        <thead>
                          <tr className="border-b border-border/40 bg-mist-gray/30">
                            <th className="p-4 font-sans text-[14px] text-slate-gray font-normal">Account No</th>
                            <th className="p-4 font-sans text-[14px] text-slate-gray font-normal">Product</th>
                            <th className="p-4 font-sans text-[14px] text-slate-gray font-normal text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchedMember.savingsAccounts?.map((sa: any) => (
                            <tr key={sa.id} className="border-b border-border/40 last:border-0">
                              <td className="p-4 text-[15px] font-medium text-ink-black">{sa.accountNumber}</td>
                              <td className="p-4 text-[15px] text-slate-gray">{sa.product?.name}</td>
                              <td className="p-4 text-[15px] text-ink-black text-right">LKR {Number(sa.balance).toLocaleString()}</td>
                            </tr>
                          ))}
                          {(!searchedMember.savingsAccounts || searchedMember.savingsAccounts.length === 0) && (
                            <tr><td colSpan={3} className="p-4 text-center text-slate-gray">No savings accounts.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}
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
