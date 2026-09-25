"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Search, Plus, X, ChevronDown, MapPin } from "lucide-react"

function AddGroupDrawer({ open, onClose, centres, onSuccess }: any) {
  const [form, setForm] = useState({ centreId: "", groupNumber: "", name: "", meetingDay: "", meetingTime: "" })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open) { setForm({ centreId: "", groupNumber: "", name: "", meetingDay: "", meetingTime: "" }); setError("") }
  }, [open])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    try {
      setSubmitting(true); setError("")
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to create group") }
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
          <div><h2 className="text-[17px] font-semibold text-navy-900">Create Group</h2><p className="text-[13px] text-slate-500 mt-0.5">Add a new member group</p></div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {error && <div className="text-[13px] text-danger-600 bg-danger-50 rounded-lg px-4 py-3 border border-danger-100">{error}</div>}
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-slate-700">Centre <span className="text-danger-500">*</span></label>
            <div className="relative">
              <select required value={form.centreId} onChange={e => setForm({...form, centreId: e.target.value})} className={`${inputCls} appearance-none pr-10`}>
                <option value="" disabled>Select centre...</option>
                {centres.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-slate-700">Group Name</label>
            <input placeholder="E.g. Araliya" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-slate-700">Group Number <span className="text-danger-500">*</span></label>
            <input required type="number" placeholder="E.g. 1" value={form.groupNumber} onChange={e => setForm({...form, groupNumber: e.target.value})} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-slate-700">Meeting Day</label>
              <select value={form.meetingDay} onChange={e => setForm({...form, meetingDay: e.target.value})} className={inputCls}>
                <option value="">Not Set</option>
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-slate-700">Meeting Time</label>
              <input type="time" value={form.meetingTime} onChange={e => setForm({...form, meetingTime: e.target.value})} className={inputCls} />
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-[14px] font-medium text-slate-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-[14px] font-medium hover:bg-brand-700 transition-colors disabled:opacity-60">{submitting ? "Creating..." : "Create Group"}</button>
          </div>
        </form>
      </aside>
    </>
  )
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<any[]>([])
  const [centres, setCentres] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [centreFilter, setCentreFilter] = useState("")

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [gr, cr] = await Promise.all([fetch("/api/groups"), fetch("/api/centres")])
      if (gr.ok) setGroups(await gr.json())
      if (cr.ok) setCentres(await cr.json())
    } finally { setIsLoading(false) }
  }
  useEffect(() => { fetchData() }, [])

  const filtered = groups.filter(g => {
    const q = search.toLowerCase()
    const matchSearch = !q || (g.name || "").toLowerCase().includes(q) || String(g.groupNumber).includes(q)
    const matchCentre = !centreFilter || g.centreId === centreFilter
    return matchSearch && matchCentre
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-navy-900 tracking-tight">Groups</h1>
          <p className="text-[14px] text-slate-500 mt-0.5">{isLoading ? "Loading..." : `${groups.length} groups across ${centres.length} centres`}</p>
        </div>
        <button onClick={() => setDrawerOpen(true)} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-[14px] font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Create Group
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input placeholder="Search groups..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-[14px] bg-white border border-gray-200 rounded-lg text-navy-900 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all" />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select value={centreFilter} onChange={e => setCentreFilter(e.target.value)} className="pl-9 pr-8 py-2.5 text-[14px] bg-white border border-gray-200 rounded-lg text-navy-900 appearance-none outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 cursor-pointer transition-all">
            <option value="">All Centres</option>
            {centres.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left py-3 px-5 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Group</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Centre</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Schedule</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Members</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={4} className="py-20 text-center text-slate-400">Loading groups...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="py-20 text-center text-slate-400">No groups found</td></tr>
              ) : filtered.map((g: any) => (
                <tr key={g.id} className="hover:bg-gray-50/70 transition-colors">
                  <td className="py-3.5 px-5">
                    <Link href={`/app/groups/${g.id}`} className="text-[14px] font-semibold text-navy-900 hover:text-brand-600 transition-colors">
                      {g.name || `Group ${g.groupNumber}`}
                    </Link>
                    <p className="text-[12px] text-slate-400 mt-0.5">Group {g.groupNumber}</p>
                  </td>
                  <td className="py-3.5 px-4 text-[13px] text-slate-600">
                     <span className="inline-flex items-center gap-1.5"><MapPin className="w-3 h-3 text-slate-400" />{g.centre?.name || "—"}</span>
                  </td>
                  <td className="py-3.5 px-4 text-[13px] text-slate-600">{g.meetingDay ? `${g.meetingDay} ${g.meetingTime || ''}` : "—"}</td>
                  <td className="py-3.5 px-4 text-[13px] text-slate-600">
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium bg-navy-50 text-navy-700 px-2.5 py-0.5 rounded-full">
                      {g.memberships?.length || 0} Members
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <AddGroupDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} centres={centres} onSuccess={() => {}} />
    </div>
  )
}
