"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Centre, Branch } from "@/lib/types"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Search, Plus, X, ChevronDown, MapPin, Building2, UserCircle2 } from "lucide-react"

function AddCentreDrawer({ open, onClose, branches, officers, onSuccess }: any) {
  const [form, setForm] = useState({ branchId: "", officerId: "", centreNumber: 1, centreCode: "", name: "", isMicro: false })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) { setForm({ branchId: "", officerId: "", centreNumber: 1, centreCode: "", name: "", isMicro: false }); setError("") }
  }, [open])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    try {
      setSubmitting(true); setError("")
      const res = await fetch("/api/centres", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, officerId: form.officerId || undefined }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to create centre") }
      onSuccess(); onClose()
    } catch (err: any) { setError(err.message) }
    finally { setSubmitting(false) }
  }

  const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-[14px] text-navy-900 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all"

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
      <aside className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div><h2 className="text-[17px] font-semibold text-navy-900">Create Centre</h2><p className="text-[13px] text-slate-500 mt-0.5">Add a new operational centre</p></div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {error && <div className="text-[13px] text-danger-600 bg-danger-50 rounded-lg px-4 py-3 border border-danger-100">{error}</div>}
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-slate-700">Branch <span className="text-danger-500">*</span></label>
            <div className="relative">
              <select required value={form.branchId} onChange={e => setForm({...form, branchId: e.target.value})} className={`${inputCls} appearance-none pr-10`}>
                <option value="" disabled>Select branch...</option>
                {branches.map((b: any) => <option key={b.id} value={b.id}>{b.name} ({b.code})</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-slate-700">Assigned Officer</label>
            <div className="relative">
              <select value={form.officerId} onChange={e => setForm({...form, officerId: e.target.value})} className={`${inputCls} appearance-none pr-10`}>
                <option value="">Unassigned</option>
                {officers.map((o: any) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-slate-700">Centre No. <span className="text-danger-500">*</span></label>
              <input required type="number" min="1" placeholder="E.g. 1" value={form.centreNumber} onChange={e => setForm({...form, centreNumber: parseInt(e.target.value) || 0})} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-slate-700">Code <span className="text-danger-500">*</span></label>
              <input required placeholder="E.g. SA01/001" value={form.centreCode} onChange={e => setForm({...form, centreCode: e.target.value})} className={inputCls} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-slate-700">Name <span className="text-danger-500">*</span></label>
            <input required placeholder="E.g. Center North" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer mt-2 group">
            <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${form.isMicro ? 'bg-brand-600 border-brand-600' : 'border-gray-300 bg-white group-hover:border-brand-600'}`}>
              {form.isMicro && <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span className="text-[13px] font-medium text-slate-700">Is Micro Loan Centre</span>
          </label>

          <div className="mt-auto pt-4 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-[14px] font-medium text-slate-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-[14px] font-medium hover:bg-brand-700 transition-colors disabled:opacity-60">{submitting ? "Creating..." : "Create Centre"}</button>
          </div>
        </form>
      </aside>
    </>
  )
}

export default function CentresPage() {
  const [centres, setCentres] = useState<any[]>([])
  const [branches, setBranches] = useState<Branch[]>([])
  const [officers, setOfficers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [branchFilter, setBranchFilter] = useState("")

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [centresRes, branchesRes, usersRes] = await Promise.all([
        fetch('/api/centres'), fetch('/api/branches'), fetch('/api/team')
      ])
      if (centresRes.ok) setCentres(await centresRes.json())
      if (branchesRes.ok) setBranches(await branchesRes.json())
      if (usersRes.ok) {
        const users = await usersRes.json()
        setOfficers(users.filter((u: any) => u.role === "USER" || u.role === "FIELD_OFFICER"))
      }
    } finally { setIsLoading(false) }
  }
  useEffect(() => { fetchData() }, [])

  const filtered = centres.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || (c.name || "").toLowerCase().includes(q) || (c.centreCode || "").toLowerCase().includes(q)
    const matchBranch = !branchFilter || c.branchId === branchFilter
    return matchSearch && matchBranch
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-navy-900 tracking-tight">Centres</h1>
          <p className="text-[14px] text-slate-500 mt-0.5">{isLoading ? "Loading..." : `${centres.length} centres active in ${branches.length} branches`}</p>
        </div>
        <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-[14px] font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Create Centre
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input placeholder="Search centres by name or code..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-[14px] bg-white border border-gray-200 rounded-lg text-navy-900 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all" />
        </div>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select value={branchFilter} onChange={e => setBranchFilter(e.target.value)} className="pl-9 pr-8 py-2.5 text-[14px] bg-white border border-gray-200 rounded-lg text-navy-900 appearance-none outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 cursor-pointer transition-all">
            <option value="">All Branches</option>
            {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left py-3 px-5 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Centre</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Branch</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Officer</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Type</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400">Loading centres...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400">No centres found</td></tr>
              ) : filtered.map(c => {
                const branch = branches.find(b => b.id === c.branchId)
                return (
                  <tr key={c.id} className="hover:bg-gray-50/70 transition-colors group">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center flex-shrink-0 text-teal-700`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-[14px] font-semibold text-navy-900 group-hover:text-brand-600 transition-colors">{c.name}</p>
                          <p className="text-[12px] text-slate-400 mt-0.5">Centre No. {c.centreNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4"><span className="text-[13px] font-mono text-slate-500">{c.centreCode}</span></td>
                    <td className="py-3.5 px-4 text-[13px] text-slate-600">{branch?.name || "—"}</td>
                    <td className="py-3.5 px-4">
                      {c.officer ? (
                        <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-600">
                          <UserCircle2 className="w-3.5 h-3.5 text-slate-400" />
                          {c.officer.name}
                        </span>
                      ) : (
                        <span className="text-[13px] text-slate-300 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {c.isMicro ? (
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium bg-amber-50 text-amber-700 px-2.5 py-0.5 rounded-full">Micro</span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[12px] font-medium bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full">Regular</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
      <AddCentreDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} branches={branches} officers={officers} onSuccess={() => {}} />
    </div>
  )
}
