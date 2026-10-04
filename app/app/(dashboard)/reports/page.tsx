"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
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
  const [reconDate, setReconDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  
  // Member Search State
  const [searchNic, setSearchNic] = useState("")
  const [searchedMember, setSearchedMember] = useState<any>(null)

  // 1. Daily Reconciliation Query (cached per date)
  const { data: reconData, isLoading: isReconLoading } = useQuery({
    queryKey: ["reports", "reconciliation", reconDate],
    queryFn: () => getDailyReconciliation(reconDate),
    enabled: activeTab === "reconciliation",
  })

  // 2. Outstanding by Centre Query
  const { data: outstandingData = [], isLoading: isOutstandingLoading } = useQuery({
    queryKey: ["reports", "outstanding"],
    queryFn: () => getOutstandingByCentre(),
    enabled: activeTab === "outstanding",
  })

  // 3. Portfolio At Risk (PAR) Query
  const { data: parData, isLoading: isParLoading } = useQuery({
    queryKey: ["reports", "par"],
    queryFn: () => getPortfolioAtRisk(),
    enabled: activeTab === "par",
  })

  // 4. Collection Efficiency Query
  const { data: efficiencyData = [], isLoading: isEfficiencyLoading } = useQuery({
    queryKey: ["reports", "efficiency"],
    queryFn: async () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      return getCollectionEfficiency(start.toISOString(), end.toISOString())
    },
    enabled: activeTab === "efficiency",
  })

  // 5. Aging Report Query
  const { data: agingData = [], isLoading: isAgingLoading } = useQuery({
    queryKey: ["reports", "aging"],
    queryFn: () => getAgingReport(),
    enabled: activeTab === "aging",
  })

  const isTabLoading =
    (activeTab === "reconciliation" && isReconLoading) ||
    (activeTab === "outstanding" && isOutstandingLoading) ||
    (activeTab === "par" && isParLoading) ||
    (activeTab === "efficiency" && isEfficiencyLoading) ||
    (activeTab === "aging" && isAgingLoading)

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!searchNic) return
    startTransition(async () => {
      try {
        const member = await getMemberHistory(searchNic)
        setSearchedMember(member || "NOT_FOUND")
      } catch (err) {
        console.error("An error occurred during fetch")
      }
    })
  }

  return (
    <div className="flex flex-col gap-8 lg:gap-[48px]">
      
      {/* Hero Section */}
      <div className="flex flex-col gap-4">
        <h1 className="text-[44px] leading-[1.3] text-navy-900 font-serif font-normal" style={{ letterSpacing: '-0.66px' }}>
          Reports & Reconciliation
        </h1>
        <p className="text-[17px] text-slate-500 max-w-[600px] leading-[1.35]">
          System overview, cash flow validation, and portfolio risk exposure.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-col gap-[40px]">
        
        <div className="flex flex-wrap items-center gap-4 border-b border-border/40 pb-4">
          <TabButton 
            active={activeTab === "reconciliation"} 
            loading={isTabLoading && activeTab === "reconciliation"}
            onClick={() => setActiveTab("reconciliation")}
          >
            Daily Reconciliation
          </TabButton>
          <TabButton 
            active={activeTab === "outstanding"} 
            loading={isTabLoading && activeTab === "outstanding"}
            onClick={() => setActiveTab("outstanding")}
          >
            Outstanding by Centre
          </TabButton>
          <TabButton 
            active={activeTab === "par"} 
            loading={isTabLoading && activeTab === "par"}
            onClick={() => setActiveTab("par")}
          >
            Portfolio at Risk (PAR)
          </TabButton>
          <TabButton 
            active={activeTab === "efficiency"} 
            loading={isTabLoading && activeTab === "efficiency"}
            onClick={() => setActiveTab("efficiency")}
          >
            Collection Efficiency
          </TabButton>
          <TabButton 
            active={activeTab === "aging"} 
            loading={isTabLoading && activeTab === "aging"}
            onClick={() => setActiveTab("aging")}
          >
            Aging Report
          </TabButton>
          <TabButton 
            active={activeTab === "member-search"} 
            onClick={() => setActiveTab("member-search")}
          >
            Member History
          </TabButton>
        </div>

        {/* Loading Skeleton during Tab Switching */}
        {isTabLoading && (
          <div className="bg-slate-50 rounded-[24px] p-[32px] md:p-[40px] space-y-6 animate-in fade-in duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-brand-600" />
                <span className="font-medium text-slate-700 text-[15px]">Loading tab data...</span>
              </div>
              <div className="h-8 w-28 bg-slate-200 rounded-lg animate-pulse" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-xl border border-border/40 h-36 animate-pulse space-y-3">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-8 w-44 bg-slate-200 rounded" />
                <div className="h-4 w-24 bg-slate-100 rounded" />
              </div>
              <div className="bg-white p-6 rounded-xl border border-border/40 h-36 animate-pulse space-y-3">
                <div className="h-4 w-32 bg-slate-200 rounded" />
                <div className="h-8 w-44 bg-slate-200 rounded" />
                <div className="h-4 w-24 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl border border-border/40 h-64 animate-pulse space-y-4">
              <div className="h-5 w-40 bg-slate-200 rounded" />
              <div className="h-10 bg-slate-100 rounded" />
              <div className="h-10 bg-slate-100 rounded" />
              <div className="h-10 bg-slate-100 rounded" />
            </div>
          </div>
        )}

        {/* Tab Content */}
        <div className="w-full">
          
          {activeTab === "reconciliation" && reconData && !isTabLoading && (
            <div className="bg-slate-50 rounded-[24px] p-[32px] md:p-[40px]">
              <div className="flex flex-wrap gap-4 justify-between items-center mb-6">
                <h2 className="text-[20px] font-sans font-medium text-navy-900">Daily Collection vs Ledger Cash</h2>
                <input 
                  type="date"
                  value={reconDate}
                  onChange={e => setReconDate(e.target.value)}
                  className="bg-white border border-[#ececec] rounded-xl px-4 py-2"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-border/40">
                  <div className="text-[15px] text-slate-500 mb-1">Field Reported (CashFlows)</div>
                  <div className="text-[24px] font-medium text-navy-900 mb-4">LKR {reconData.fieldReportedCollection.toLocaleString()}</div>
                  
                  <div className="text-[15px] text-slate-500 mb-1">Ledger Cash Debit (Journal 1000)</div>
                  <div className="text-[24px] font-medium text-navy-900">LKR {reconData.systemCashIn.toLocaleString()}</div>
                  
                  <div className={`mt-4 pt-4 border-t border-border/40 font-medium ${reconData.discrepancyCollection !== 0 ? 'text-brand-700' : 'text-[#137333]'}`}>
                    Variance: LKR {reconData.discrepancyCollection.toLocaleString()}
                  </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-border/40">
                  <div className="text-[15px] text-slate-500 mb-1">Field Reported Disbursements</div>
                  <div className="text-[24px] font-medium text-navy-900 mb-4">LKR {reconData.fieldReportedDisbursement.toLocaleString()}</div>
                  
                  <div className="text-[15px] text-slate-500 mb-1">Ledger Cash Credit (Journal 1000)</div>
                  <div className="text-[24px] font-medium text-navy-900">LKR {reconData.systemCashOut.toLocaleString()}</div>
                  
                  <div className={`mt-4 pt-4 border-t border-border/40 font-medium ${reconData.discrepancyDisbursement !== 0 ? 'text-brand-700' : 'text-[#137333]'}`}>
                    Variance: LKR {reconData.discrepancyDisbursement.toLocaleString()}
                  </div>
                </div>
              </div>

              <h3 className="text-[16px] font-medium text-navy-900 mb-4">Field Submissions for {reconDate}</h3>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Centre</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Type</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal text-right">Target</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal text-right">Collected</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal text-right">Issued</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(reconData?.cashFlows) && reconData.cashFlows.map((cf: any) => (
                      <tr key={cf.id} className="border-b border-border/40 last:border-0">
                        <td className="py-5 pr-4 text-[16px] font-sans text-navy-900 font-medium">{cf.centreName}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-slate-500">{cf.loanType}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-slate-500 text-right">LKR {Number(cf.totalRecovery).toLocaleString()}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-navy-900 text-right">LKR {Number(cf.dcAmount).toLocaleString()}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-navy-900 text-right">LKR {Number(cf.amountIssued).toLocaleString()}</td>
                      </tr>
                    ))}
                    {reconData.cashFlows.length === 0 && (
                      <tr><td colSpan={5} className="py-5 text-center text-slate-500">No cashflows reported.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "outstanding" && outstandingData && !isTabLoading && (
            <div className="bg-slate-50 rounded-[24px] p-[32px] md:p-[40px]">
              <h2 className="text-[20px] font-sans font-medium text-navy-900 mb-6">Aggregated Outstanding Balances</h2>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Branch</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Centre</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal text-center">Active Loans</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal text-right">Total Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(outstandingData) && outstandingData.map((d: any) => (
                      <tr key={d.centre.id} className="border-b border-border/40 last:border-0">
                        <td className="py-5 pr-4 text-[16px] font-sans text-slate-500">{d.centre.branch.name}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-navy-900 font-medium">{d.centre.name}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-center">{d.activeLoans}</td>
                        <td className="py-5 pl-4 text-[16px] font-sans text-navy-900 text-right">LKR {d.totalOutstanding.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "par" && parData && !isTabLoading && (
            <div className="bg-slate-50 rounded-[24px] p-[32px] md:p-[40px]">
              <h2 className="text-[20px] font-sans font-medium text-navy-900 mb-6">Portfolio at Risk (PAR)</h2>
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-border/40">
                    <div className="text-[14px] text-slate-500">PAR 1+</div>
                    <div className="text-[20px] font-medium mt-1">LKR {parData.par1.toLocaleString()}</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-border/40">
                    <div className="text-[14px] text-slate-500">PAR 7+</div>
                    <div className="text-[20px] font-medium mt-1">LKR {parData.par7.toLocaleString()}</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-border/40">
                    <div className="text-[14px] text-slate-500">PAR 30+</div>
                    <div className="text-[20px] font-medium mt-1">LKR {parData.par30.toLocaleString()}</div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-border/40">
                    <div className="text-[14px] text-slate-500">PAR 90+</div>
                    <div className="text-[20px] font-medium mt-1 text-brand-700">LKR {parData.par90.toLocaleString()}</div>
                  </div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-border/40">
                  <div className="text-[15px] text-slate-500 mb-2">Total Outstanding: LKR {parData.totalOutstanding.toLocaleString()}</div>
                  <div className="text-[15px] text-slate-500">Total PAR: LKR {parData.parTotal.toLocaleString()} ({((parData.parTotal / (parData.totalOutstanding || 1)) * 100).toFixed(2)}%)</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "efficiency" && efficiencyData && !isTabLoading && (
            <div className="bg-slate-50 rounded-[24px] p-[32px] md:p-[40px]">
              <h2 className="text-[20px] font-sans font-medium text-navy-900 mb-6">Collection Efficiency (Last 30 Days)</h2>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Branch</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Centre</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal text-right">Expected</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal text-right">Collected</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal text-right">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(efficiencyData) && efficiencyData.map((d: any) => (
                      <tr key={d.centreName} className="border-b border-border/40 last:border-0">
                        <td className="py-5 pr-4 text-[16px] font-sans text-slate-500">{d.branchName}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-navy-900 font-medium">{d.centreName}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-slate-500 text-right">LKR {d.scheduled.toLocaleString()}</td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-navy-900 text-right">LKR {d.collected.toLocaleString()}</td>
                        <td className="py-5 pl-4 text-[16px] font-sans font-medium text-right">
                          {d.efficiency.toFixed(2)}%
                        </td>
                      </tr>
                    ))}
                    {efficiencyData.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-5 text-center text-slate-500">No data available.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "aging" && agingData && !isTabLoading && (
            <div className="bg-slate-50 rounded-[24px] p-[32px] md:p-[40px]">
              <h2 className="text-[20px] font-sans font-medium text-navy-900 mb-6">Aging Report</h2>
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/40">
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Loan No</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Member</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal text-center">Days Past Due</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal text-right">Overdue Amount</th>
                      <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal text-right">Outstanding</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(agingData) && agingData.map((d: any) => (
                      <tr key={d.loanId} className="border-b border-border/40 last:border-0">
                        <td className="py-5 pr-4 text-[16px] font-sans text-navy-900 font-medium">
                          <Link href={`/app/loans/${d.loanId}`} className="hover:underline">{d.loanNumber || d.loanId.slice(0,8)}</Link>
                        </td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-slate-500">{d.memberName}</td>
                        <td className={`py-5 pr-4 text-[16px] font-sans text-center font-medium ${d.daysPastDue > 30 ? 'text-brand-700' : 'text-navy-900'}`}>
                          {d.daysPastDue}
                        </td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-brand-700 text-right">LKR {d.overdueAmount.toLocaleString()}</td>
                        <td className="py-5 pl-4 text-[16px] font-sans text-slate-500 text-right">LKR {d.outstanding.toLocaleString()}</td>
                      </tr>
                    ))}
                    {agingData.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-5 text-center text-slate-500">No overdue loans.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "member-search" && (
            <div className="bg-slate-50 rounded-[24px] p-[32px] md:p-[40px]">
              <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center mb-8">
                <div>
                  <h2 className="text-[20px] font-sans font-medium text-navy-900 mb-1">Member History</h2>
                  <p className="text-[15px] text-slate-500">Search by NIC to view complete history</p>
                </div>
                <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
                  <input
                    value={searchNic}
                    onChange={e => setSearchNic(e.target.value)}
                    placeholder="Enter NIC..."
                    className="bg-white border border-[#ececec] rounded-xl px-4 py-2 flex-grow md:w-[250px] outline-none focus:border-navy-900"
                  />
                  <button 
                    disabled={isPending}
                    type="submit" 
                    className="bg-navy-900 text-white px-6 py-2 rounded-xl font-medium"
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
                  <div className="bg-white p-6 rounded-xl border border-border/40">
                    <h3 className="text-[18px] font-medium text-navy-900 mb-4">{searchedMember.name}</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[15px]">
                      <div>
                        <div className="text-slate-500 mb-1">NIC</div>
                        <div className="font-medium text-navy-900">{searchedMember.nic}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-1">Member No</div>
                        <div className="font-medium text-navy-900">{searchedMember.memberNumber}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-1">Centre</div>
                        <div className="font-medium text-navy-900">{searchedMember.centre?.name}</div>
                      </div>
                      <div>
                        <div className="text-slate-500 mb-1">Contact</div>
                        <div className="font-medium text-navy-900">{searchedMember.contact1 || "N/A"}</div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[16px] font-medium text-navy-900 mb-4">Loan History</h3>
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse bg-white rounded-xl border border-border/40 overflow-hidden">
                        <thead>
                          <tr className="border-b border-border/40 bg-slate-50/30">
                            <th className="p-4 font-sans text-[14px] text-slate-500 font-normal">Loan No</th>
                            <th className="p-4 font-sans text-[14px] text-slate-500 font-normal">Granted</th>
                            <th className="p-4 font-sans text-[14px] text-slate-500 font-normal text-right">Amount</th>
                            <th className="p-4 font-sans text-[14px] text-slate-500 font-normal">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(searchedMember.loans) && searchedMember.loans.map((l: any) => (
                            <tr key={l.id} className="border-b border-border/40 last:border-0">
                              <td className="p-4 text-[15px] font-medium text-navy-900">
                                <Link href={`/app/loans/${l.id}`} className="hover:underline">{l.loanNumber || l.id.slice(0,8)}</Link>
                              </td>
                              <td className="p-4 text-[15px] text-slate-500">{format(new Date(l.grantedDate), "yyyy-MM-dd")}</td>
                              <td className="p-4 text-[15px] text-navy-900 text-right">LKR {Number(l.loanAmount).toLocaleString()}</td>
                              <td className="p-4 text-[15px]">
                                <span className="px-2.5 py-1 rounded-full text-[12px] font-medium bg-slate-50">{l.status}</span>
                              </td>
                            </tr>
                          ))}
                          {(!searchedMember.loans || searchedMember.loans.length === 0) && (
                            <tr><td colSpan={4} className="p-4 text-center text-slate-500">No loans found.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-[16px] font-medium text-navy-900 mb-4">Savings Accounts</h3>
                    <div className="w-full overflow-x-auto">
                      <table className="w-full text-left border-collapse bg-white rounded-xl border border-border/40 overflow-hidden">
                        <thead>
                          <tr className="border-b border-border/40 bg-slate-50/30">
                            <th className="p-4 font-sans text-[14px] text-slate-500 font-normal">Account No</th>
                            <th className="p-4 font-sans text-[14px] text-slate-500 font-normal">Product</th>
                            <th className="p-4 font-sans text-[14px] text-slate-500 font-normal text-right">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Array.isArray(searchedMember.savingsAccounts) && searchedMember.savingsAccounts.map((sa: any) => (
                            <tr key={sa.id} className="border-b border-border/40 last:border-0">
                              <td className="p-4 text-[15px] font-medium text-navy-900">{sa.accountNumber}</td>
                              <td className="p-4 text-[15px] text-slate-500">{sa.product?.name}</td>
                              <td className="p-4 text-[15px] text-navy-900 text-right">LKR {Number(sa.balance).toLocaleString()}</td>
                            </tr>
                          ))}
                          {(!searchedMember.savingsAccounts || searchedMember.savingsAccounts.length === 0) && (
                            <tr><td colSpan={3} className="p-4 text-center text-slate-500">No savings accounts.</td></tr>
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

function TabButton({ 
  active, 
  loading, 
  onClick, 
  children 
}: { 
  active: boolean
  loading?: boolean
  onClick: () => void
  children: React.ReactNode 
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 px-[20px] py-[10px] rounded-full text-[15px] font-sans transition-all ${
        active 
          ? "bg-navy-900 text-white font-medium shadow-sm" 
          : "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-navy-900"
      }`}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin text-brand-300" />}
      {children}
    </button>
  )
}
