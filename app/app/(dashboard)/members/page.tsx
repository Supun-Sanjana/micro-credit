"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Member, Centre } from "@/lib/types"
import { Search, Plus, X, ChevronDown, Users, MapPin, Hash } from "lucide-react"

// ─── Helper ──────────────────────────────────────────────────────────────────
function initials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("")
}

const AVATAR_COLORS = [
  "bg-brand-600", "bg-navy-700", "bg-violet-600",
  "bg-amber-600", "bg-rose-600", "bg-teal-700",
]

function avatarColor(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

// ─── Drawer ───────────────────────────────────────────────────────────────────
function AddMemberDrawer({
  open, onClose, centres, onSuccess
}: {
  open: boolean
  onClose: () => void
  centres: Centre[]
  onSuccess: () => void
}) {
  const [form, setForm] = useState({ centreId: "", name: "", nic: "", contact1: "", groupNumber: "" })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) { setForm({ centreId: "", name: "", nic: "", contact1: "", groupNumber: "" }); setError("") }
    if (open) setTimeout(() => nameRef.current?.focus(), 120)
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true); setError("")
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, groupNumber: form.groupNumber ? parseInt(form.groupNumber) : undefined }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to register") }
      onSuccess(); onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-[17px] font-semibold text-navy-900">Register Member</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">Add a new community member</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">

          {error && (
            <div className="text-[13px] text-danger-600 bg-danger-50 rounded-lg px-4 py-3 border border-danger-100">
              {error}
            </div>
          )}

          <Field label="Full Name" required>
            <input
              ref={nameRef}
              required
              placeholder="E.g. Kamal Perera"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </Field>

          <Field label="Centre" required>
            <div className="relative">
              <select
                required
                value={form.centreId}
                onChange={(e) => setForm({ ...form, centreId: e.target.value })}
                className={`${inputCls} appearance-none pr-10`}
              >
                <option value="" disabled>Select centre…</option>
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.centreCode})</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="National ID">
              <input
                placeholder="Optional"
                value={form.nic}
                onChange={(e) => setForm({ ...form, nic: e.target.value })}
                className={inputCls}
              />
            </Field>
            <Field label="Group No.">
              <input
                type="number"
                min="1" max="6"
                placeholder="1 – 6"
                value={form.groupNumber}
                onChange={(e) => setForm({ ...form, groupNumber: e.target.value })}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Contact" required>
            <input
              required
              placeholder="077XXXXXXX"
              value={form.contact1}
              onChange={(e) => setForm({ ...form, contact1: e.target.value })}
              className={inputCls}
            />
          </Field>

          <div className="mt-auto pt-4 border-t border-gray-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-[14px] font-medium text-slate-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-[14px] font-medium hover:bg-brand-700 transition-colors disabled:opacity-60"
            >
              {submitting ? "Registering…" : "Register Member"}
            </button>
          </div>
        </form>
      </aside>
    </>
  )
}

const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-[14px] text-navy-900 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all"

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-slate-700">
        {label}{required && <span className="text-danger-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [centres, setCentres] = useState<Centre[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [centreFilter, setCentreFilter] = useState("")
  const [groupFilter, setGroupFilter] = useState("")

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [mr, cr] = await Promise.all([fetch("/api/members"), fetch("/api/centres")])
      if (mr.ok) setMembers(await mr.json())
      if (cr.ok) setCentres(await cr.json())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filtered = members.filter((m) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      (m.nic ?? "").toLowerCase().includes(q) ||
      (m.memberNumber ?? "").toLowerCase().includes(q)
    const matchCentre = !centreFilter || m.centreId === centreFilter
    const matchGroup = !groupFilter || String(m.groupNumber) === groupFilter
    return matchSearch && matchCentre && matchGroup
  })

  const uniqueGroups = [...new Set(members.map((m) => m.groupNumber).filter(Boolean))]

  return (
    <div className="flex flex-col h-full">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-navy-900 tracking-tight">Members</h1>
          <p className="text-[14px] text-slate-500 mt-0.5">
            {isLoading ? "Loading…" : `${members.length} registered member${members.length !== 1 ? "s" : ""} across ${centres.length} centre${centres.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-[14px] font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* ── Search + Filters ── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search by name, NIC, or member no…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-[14px] bg-white border border-gray-200 rounded-lg text-navy-900 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
          />
        </div>

        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={centreFilter}
            onChange={(e) => setCentreFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 text-[14px] bg-white border border-gray-200 rounded-lg text-navy-900 appearance-none outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 cursor-pointer transition-all"
          >
            <option value="">All Centres</option>
            {centres.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative">
          <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="pl-9 pr-8 py-2.5 text-[14px] bg-white border border-gray-200 rounded-lg text-navy-900 appearance-none outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 cursor-pointer transition-all"
          >
            <option value="">All Groups</option>
            {uniqueGroups.map((g) => <option key={g} value={String(g)}>Group {g}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left py-3 px-5 text-[12px] font-semibold text-slate-500 uppercase tracking-wider w-[260px]">Member</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Member No.</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Centre</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Group</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">NIC</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="inline-flex flex-col items-center gap-3 text-slate-400">
                      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-[14px]">Loading members…</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="inline-flex flex-col items-center gap-3 text-slate-400">
                      <Users className="w-10 h-10 text-slate-200" />
                      <div>
                        <p className="text-[15px] font-medium text-slate-600">No members found</p>
                        <p className="text-[13px] text-slate-400 mt-1">
                          {search || centreFilter || groupFilter ? "Try adjusting your filters" : "Register your first member to get started"}
                        </p>
                      </div>
                      {!search && !centreFilter && !groupFilter && (
                        <button
                          onClick={() => setDrawerOpen(true)}
                          className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-brand-600 hover:text-brand-700"
                        >
                          <Plus className="w-4 h-4" /> Add Member
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((m) => {
                  const centre = centres.find((c) => c.id === m.centreId)
                  const color = avatarColor(m.id)
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/70 transition-colors group">
                      {/* Name + Avatar */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-[12px] font-bold text-white">{initials(m.name)}</span>
                          </div>
                          <div>
                            <Link
                              href={`/app/members/${m.id}`}
                              className="text-[14px] font-semibold text-navy-900 hover:text-brand-600 transition-colors"
                            >
                              {m.name}
                            </Link>
                            {m.contact1 && (
                              <p className="text-[12px] text-slate-400 mt-0.5">{m.contact1}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      {/* Member No */}
                      <td className="py-3.5 px-4">
                        <Link href={`/app/members/${m.id}`} className="text-[13px] font-mono text-brand-600 hover:text-brand-700 hover:underline transition-colors">
                          {m.memberNumber ?? "—"}
                        </Link>
                      </td>
                      {/* Centre */}
                      <td className="py-3.5 px-4">
                        {centre ? (
                          <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-600">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {centre.name}
                          </span>
                        ) : (
                          <span className="text-[13px] text-slate-300">—</span>
                        )}
                      </td>
                      {/* Group */}
                      <td className="py-3.5 px-4">
                        {m.groupNumber ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium bg-navy-50 text-navy-700 px-2.5 py-0.5 rounded-full">
                            G{m.groupNumber}
                          </span>
                        ) : (
                          <span className="text-[13px] text-slate-300">—</span>
                        )}
                      </td>
                      {/* NIC */}
                      <td className="py-3.5 px-4">
                        <span className="text-[13px] font-mono text-slate-500">{m.nic || "—"}</span>
                      </td>
                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium bg-success-50 text-success-700 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
                          Active
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        {!isLoading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
            <span className="text-[12px] text-slate-400">
              Showing {filtered.length} of {members.length} members
            </span>
          </div>
        )}
      </div>

      {/* ── Add Member Drawer ── */}
      <AddMemberDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        centres={centres}
        onSuccess={fetchData}
      />
    </div>
  )
}
