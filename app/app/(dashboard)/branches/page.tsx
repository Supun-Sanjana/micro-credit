"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Branch } from "@/lib/types"
import { Search, Plus, X, Building, MapPin } from "lucide-react"

function AddBranchDrawer({ open, onClose, onSuccess }: any) {
  const [form, setForm] = useState({ code: "", name: "", address: "" })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) { setForm({ code: "", name: "", address: "" }); setError("") }
  }, [open])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    try {
      setSubmitting(true); setError("")
      const res = await fetch("/api/branches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to create branch") }
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
          <div><h2 className="text-[17px] font-semibold text-navy-900">Create Branch</h2><p className="text-[13px] text-slate-500 mt-0.5">Add a new regional branch</p></div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {error && <div className="text-[13px] text-danger-600 bg-danger-50 rounded-lg px-4 py-3 border border-danger-100">{error}</div>}
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-slate-700">Branch Code <span className="text-danger-500">*</span></label>
            <input required placeholder="E.g. SA01" value={form.code} onChange={e => setForm({...form, code: e.target.value})} className={inputCls} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-slate-700">Branch Name <span className="text-danger-500">*</span></label>
            <input required placeholder="E.g. GALLE" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-slate-700">Address</label>
            <input placeholder="Street Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className={inputCls} />
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-[14px] font-medium text-slate-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-[14px] font-medium hover:bg-brand-700 transition-colors disabled:opacity-60">{submitting ? "Creating..." : "Create Branch"}</button>
          </div>
        </form>
      </aside>
    </>
  )
}

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState("")

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/branches')
      if (res.ok) setBranches(await res.json())
    } finally { setIsLoading(false) }
  }
  useEffect(() => { fetchData() }, [])

  const filtered = branches.filter(b => {
    const q = search.toLowerCase()
    return !q || (b.name || "").toLowerCase().includes(q) || (b.code || "").toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-navy-900 tracking-tight">Branches</h1>
          <p className="text-[14px] text-slate-500 mt-0.5">{isLoading ? "Loading..." : `${branches.length} registered branches`}</p>
        </div>
        <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-[14px] font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Create Branch
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-[480px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input placeholder="Search branches by name or code..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-[14px] bg-white border border-gray-200 rounded-lg text-navy-900 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all" />
        </div>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left py-3 px-5 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Branch</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Code</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Location</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={3} className="py-20 text-center text-slate-400">Loading branches...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={3} className="py-20 text-center text-slate-400">No branches found</td></tr>
              ) : filtered.map(b => (
                <tr key={b.id} className="hover:bg-gray-50/70 transition-colors group">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0 text-blue-700`}>
                        <Building className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-navy-900">{b.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4"><span className="text-[13px] font-mono text-brand-600">{b.code}</span></td>
                  <td className="py-3.5 px-4 text-[13px] text-slate-600">
                    {b.address ? (
                      <span className="inline-flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{b.address}</span>
                    ) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <AddBranchDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} onSuccess={() => {}} />
    </div>
  )
}
