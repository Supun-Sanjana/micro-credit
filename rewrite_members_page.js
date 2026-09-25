const fs = require('fs');

const file = 'app/app/(dashboard)/members/page.tsx';
let c = fs.readFileSync(file, 'utf8');

// Replace standard imports
c = c.replace('import { useState, useEffect, useRef } from "react"', 'import { useState, useEffect, useRef } from "react"\nimport { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"');

// We need to rewrite the page component itself
const regex = /export default function MembersPage\(\) \{[\s\S]*\}\s*$/;

const newPage = `export default function MembersPage() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [centreFilter, setCentreFilter] = useState("")
  const [groupFilter, setGroupFilter] = useState("")
  const [page, setPage] = useState(1)
  const limit = 10

  const queryClient = useQueryClient()

  const { data: centresData } = useQuery({
    queryKey: ['centres'],
    queryFn: async () => {
      const res = await fetch("/api/centres")
      return res.json()
    }
  })
  
  const centres: Centre[] = centresData?.data || centresData || []

  const { data: membersRes, isLoading, isFetching } = useQuery({
    queryKey: ['members', page, limit, centreFilter],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: limit.toString() })
      if (centreFilter) params.set("centreId", centreFilter)
      const res = await fetch(\`/api/members?\${params.toString()}\`)
      return res.json()
    }
  })

  const members: Member[] = membersRes?.data || []
  const total = membersRes?.meta?.total || 0
  const totalPages = membersRes?.meta?.totalPages || 1

  // Client side filtering for search & group (in a real app, these should also go to backend if total is large)
  const filtered = members.filter((m) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      m.name.toLowerCase().includes(q) ||
      (m.nic ?? "").toLowerCase().includes(q) ||
      (m.memberNumber ?? "").toLowerCase().includes(q)
    const matchGroup = !groupFilter || String(m.groupNumber) === groupFilter
    return matchSearch && matchGroup
  })

  const uniqueGroups = [...new Set(members.map((m) => m.groupNumber).filter(Boolean))]

  return (
    <div className="flex flex-col h-full">

      {/* -- Page Header -- */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-navy-900 tracking-tight">Members</h1>
          <p className="text-[14px] text-slate-500 mt-0.5">
            {isLoading ? "Loading…" : \`\${total} registered member\${total !== 1 ? "s" : ""} across \${centres.length} centre\${centres.length !== 1 ? "s" : ""}\`}
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

      {/* -- Search + Filters -- */}
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
            onChange={(e) => { setCentreFilter(e.target.value); setPage(1); }}
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

      {/* -- Table -- */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto flex-1">
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
                  const centre = centres.find((c) => c.id === m.centreId) || m.centre
                  const color = avatarColor(m.id)
                  return (
                    <tr key={m.id} className="hover:bg-gray-50/70 transition-colors group">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className={\`w-9 h-9 rounded-full \${color} flex items-center justify-center flex-shrink-0\`}>
                            <span className="text-[12px] font-bold text-white">{initials(m.name)}</span>
                          </div>
                          <div>
                            <Link
                              href={\`/app/members/\${m.id}\`}
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
                      <td className="py-3.5 px-4">
                        <Link href={\`/app/members/\${m.id}\`} className="text-[13px] font-mono text-brand-600 hover:text-brand-700 hover:underline transition-colors">
                          {m.memberNumber ?? "—"}
                        </Link>
                      </td>
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
                      <td className="py-3.5 px-4">
                        {m.groupNumber ? (
                          <span className="inline-flex items-center gap-1 text-[12px] font-medium bg-navy-50 text-navy-700 px-2.5 py-0.5 rounded-full">
                            G{m.groupNumber}
                          </span>
                        ) : (
                          <span className="text-[13px] text-slate-300">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[13px] font-mono text-slate-500">{m.nic || "—"}</span>
                      </td>
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

        {/* Table Footer with Pagination */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
          <span className="text-[13px] text-slate-500 flex items-center gap-2">
            Showing {filtered.length} of {total} members
            {isFetching && <span className="inline-block w-3 h-3 border-2 border-brand-600 border-t-transparent rounded-full animate-spin ml-2"></span>}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-md border border-gray-200 text-[13px] font-medium text-slate-600 disabled:opacity-50 hover:bg-gray-100 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-md border border-gray-200 text-[13px] font-medium text-slate-600 disabled:opacity-50 hover:bg-gray-100 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <AddMemberDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        centres={centres}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['members'] })}
      />
    </div>
  )
}
`

c = c.replace(regex, newPage);
fs.writeFileSync(file, c);
console.log('done');
