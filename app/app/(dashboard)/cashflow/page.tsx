"use client"

import { useState, useEffect } from "react"
import { getCashFlows, upsertCashFlow } from "@/app/actions/cashflow"

export default function CashFlowPage() {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0])
  const [flows, setFlows] = useState<any[]>([])
  const [branches, setBranches] = useState<any[]>([])
  const [centres, setCentres] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  
  const [isModalOpen, setModalOpen] = useState(false)
  const [formData, setFormData] = useState({
    branchId: "",
    centreName: "",
    loanType: "QUICK",
    loansIssued: 0,
    amountIssued: 0,
    dcAmount: 0,
    recoveryAmount: 0,
    totalRecovery: 0,
    note: ""
  })

  useEffect(() => {
    async function loadData() {
      setLoading(true)
      try {
        const [bRes, cRes] = await Promise.all([
          fetch('/api/branches'),
          fetch('/api/centres')
        ])
        if (bRes.ok) setBranches(await bRes.json())
        if (cRes.ok) setCentres(await cRes.json())
        
        await loadFlows(date)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  async function loadFlows(d: string) {
    const data = await getCashFlows(d)
    setFlows(data)
  }

  const handleDateChange = async (newDate: string) => {
    setDate(newDate)
    setLoading(true)
    await loadFlows(newDate)
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await upsertCashFlow({
        ...formData,
        date
      })
      setModalOpen(false)
      setLoading(true)
      await loadFlows(date)
      setLoading(false)
    } catch (err) {
      console.error(err)
      alert("Failed to save cash flow record")
    }
  }

  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-serif font-medium tracking-tight text-ink-black mb-1">
            Daily Cash Flow
          </h1>
          <p className="text-[15px] text-slate-gray">
            Track daily disbursements and collections by branch and centre.
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <input 
            type="date" 
            value={date}
            onChange={(e) => handleDateChange(e.target.value)}
            className="bg-paper-white border border-[#ececec] rounded-full px-4 py-2 text-[14px] text-ink-black outline-none focus:border-ink-black shadow-subtle"
          />
          <button 
            onClick={() => {
              setFormData({ ...formData, branchId: branches[0]?.id || "" })
              setModalOpen(true)
            }}
            className="bg-ink-black text-paper-white rounded-full px-5 py-2 text-[14px] font-medium hover:opacity-90 shadow-subtle"
          >
            Add Record
          </button>
        </div>
      </div>

      <div className="bg-paper-white rounded-[24px] p-6 shadow-subtle border border-[#ececec]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/40">
                <th className="pb-4 font-sans text-[13px] text-slate-gray font-medium uppercase tracking-wider">Branch</th>
                <th className="pb-4 font-sans text-[13px] text-slate-gray font-medium uppercase tracking-wider">Centre</th>
                <th className="pb-4 font-sans text-[13px] text-slate-gray font-medium uppercase tracking-wider">Type</th>
                <th className="pb-4 font-sans text-[13px] text-slate-gray font-medium uppercase tracking-wider">Issued</th>
                <th className="pb-4 font-sans text-[13px] text-slate-gray font-medium uppercase tracking-wider">Recovered</th>
                <th className="pb-4 font-sans text-[13px] text-slate-gray font-medium uppercase tracking-wider">Note</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-gray text-[14px]">Loading...</td>
                </tr>
              ) : flows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-gray text-[14px]">No cash flow records for this date.</td>
                </tr>
              ) : (
                flows.map(f => (
                  <tr key={f.id} className="border-b border-border/40 last:border-0 hover:bg-mist-gray/30 transition-colors cursor-pointer" onClick={() => {
                    setFormData({
                      branchId: f.branchId,
                      centreName: f.centreName,
                      loanType: f.loanType,
                      loansIssued: f.loansIssued,
                      amountIssued: Number(f.amountIssued),
                      dcAmount: Number(f.dcAmount),
                      recoveryAmount: Number(f.recoveryAmount),
                      totalRecovery: Number(f.totalRecovery),
                      note: f.note || ""
                    })
                    setModalOpen(true)
                  }}>
                    <td className="py-4 pr-4 text-[15px] text-ink-black">{f.branch.name}</td>
                    <td className="py-4 pr-4 text-[15px] font-medium text-ink-black">{f.centreName}</td>
                    <td className="py-4 pr-4 text-[14px] text-slate-gray">{f.loanType}</td>
                    <td className="py-4 pr-4">
                      <span className="text-[15px] text-ink-black">LKR {Number(f.amountIssued).toLocaleString()}</span>
                      <span className="text-[13px] text-slate-gray block">({f.loansIssued} loans)</span>
                    </td>
                    <td className="py-4 pr-4 text-[15px] text-[#137333] font-medium">LKR {Number(f.totalRecovery).toLocaleString()}</td>
                    <td className="py-4 pr-4 text-[14px] text-slate-gray max-w-[200px] truncate">{f.note}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-ink-black/20 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-paper-white rounded-[24px] p-8 max-w-md w-full shadow-subtle-3 max-h-[90vh] overflow-y-auto">
            <h2 className="text-[20px] font-medium text-ink-black mb-6">Cash Flow Record</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] text-slate-gray">Branch</label>
                  <select required value={formData.branchId} onChange={e => setFormData({...formData, branchId: e.target.value})} className="bg-mist-gray rounded-xl px-4 py-3 text-[15px] outline-none">
                    <option value="">Select Branch</option>
                    {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] text-slate-gray">Loan Type</label>
                  <select required value={formData.loanType} onChange={e => setFormData({...formData, loanType: e.target.value})} className="bg-mist-gray rounded-xl px-4 py-3 text-[15px] outline-none">
                    <option value="QUICK">Quick</option>
                    <option value="BUSINESS">Business</option>
                    <option value="MICRO">Micro</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] text-slate-gray">Centre</label>
                <select required value={formData.centreName} onChange={e => setFormData({...formData, centreName: e.target.value})} className="bg-mist-gray rounded-xl px-4 py-3 text-[15px] outline-none">
                  <option value="">Select Centre</option>
                  {centres.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] text-slate-gray">Loans Issued</label>
                  <input type="number" required value={formData.loansIssued} onChange={e => setFormData({...formData, loansIssued: Number(e.target.value)})} className="bg-mist-gray rounded-xl px-4 py-3 text-[15px] outline-none" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[14px] text-slate-gray">Amount Issued</label>
                  <input type="number" step="0.01" required value={formData.amountIssued} onChange={e => setFormData({...formData, amountIssued: Number(e.target.value)})} className="bg-mist-gray rounded-xl px-4 py-3 text-[15px] outline-none" />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[14px] text-slate-gray">Total Recovery (Cash In)</label>
                <input type="number" step="0.01" required value={formData.totalRecovery} onChange={e => setFormData({...formData, totalRecovery: Number(e.target.value)})} className="bg-mist-gray rounded-xl px-4 py-3 text-[15px] outline-none" />
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <label className="text-[14px] text-slate-gray">Note</label>
                <textarea value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} className="bg-mist-gray rounded-xl px-4 py-3 text-[15px] outline-none min-h-[80px]" placeholder="Optional notes..."></textarea>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 border border-[#ececec] rounded-full font-medium hover:bg-mist-gray transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-ink-black text-paper-white rounded-full font-medium hover:opacity-90 transition-opacity">Save Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
