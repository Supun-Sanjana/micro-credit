"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Search, Plus, FileText } from "lucide-react"

type Loan = { id: string; loanAmount: string; outstanding: string; status: string; verificationStatus: string; member: { name: string }; loanProduct?: { name: string } | null }

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetch("/api/loans")
      .then(async r => {
        if (r.ok) setLoans(await r.json())
        else setError((await r.json()).error || "Could not load loans")
      })
      .catch(() => setError("Could not load loans"))
      .finally(() => setIsLoading(false))
  }, [])

  const pending = loans.filter(l => ["PENDING", "DRAFT", "SUBMITTED", "UNDER_REVIEW"].includes(l.status) || l.verificationStatus === "PENDING")
  
  const filtered = loans.filter(l => {
    const q = search.toLowerCase()
    return !q || l.member.name.toLowerCase().includes(q) || (l.loanProduct?.name || "").toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col h-full gap-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[26px] font-bold text-navy-900 tracking-tight">Loan Portfolio</h1>
          <p className="text-[14px] text-slate-500 mt-0.5">{isLoading ? "Loading..." : `${loans.length} loans in portfolio`}</p>
        </div>
        <Link href="/app/loans/new" className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-[14px] font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> New Application
        </Link>
      </div>

      {error && <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg text-[14px]">{error}</div>}

      {pending.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
          <h2 className="text-[15px] font-semibold text-amber-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Review Queue ({pending.length})
          </h2>
          <div className="flex flex-col gap-2">
            {pending.map(l => (
              <Link key={l.id} href={`/app/loans/${l.id}`} className="bg-white px-4 py-3 rounded-lg shadow-sm border border-amber-100/50 flex justify-between items-center hover:border-amber-300 transition-colors">
                <div className="flex flex-col">
                  <span className="text-[14px] font-medium text-navy-900">{l.member.name}</span>
                  <span className="text-[12px] text-slate-500">{l.loanProduct?.name || "Product unavailable"}</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[14px] font-medium text-navy-900">LKR {Number(l.loanAmount).toLocaleString()}</span>
                  <span className="text-[12px] font-medium text-amber-600 uppercase tracking-wider">{l.status}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-[480px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input placeholder="Search loans by member or product..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-[14px] bg-white border border-gray-200 rounded-lg text-navy-900 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all" />
        </div>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="py-3 px-5 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Borrower</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Amount</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Outstanding</th>
                <th className="py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400">Loading loans...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400">No loans found</td></tr>
              ) : filtered.map(l => (
                <tr key={l.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-5">
                    <Link href={`/app/loans/${l.id}`} className="text-[14px] font-semibold text-navy-900 hover:text-brand-600 transition-colors">
                      {l.member.name}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 text-[13px] text-slate-600">{l.loanProduct?.name || "—"}</td>
                  <td className="py-3.5 px-4 text-[13px] font-medium text-navy-900">LKR {Number(l.loanAmount).toLocaleString()}</td>
                  <td className="py-3.5 px-4 text-[13px] text-slate-600">LKR {Number(l.outstanding).toLocaleString()}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${l.status === 'ACTIVE' ? 'bg-success-50 text-success-700' : l.status === 'ARREARS' || l.status === 'DEFAULTED' ? 'bg-danger-50 text-danger-700' : 'bg-slate-100 text-slate-600'}`}>
                      {l.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
