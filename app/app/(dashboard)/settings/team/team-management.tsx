"use client"

import { useState, useRef, useEffect } from "react"
import { 
  Search, Plus, X, ChevronDown, Users, Building, 
  Shield, Eye, EyeOff, Loader2 
} from "lucide-react"

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(name: string) {
  if (!name) return "U"
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

const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-[14px] text-navy-900 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all"

function EditTeamMemberDrawer({
  user,
  open,
  onClose,
  branches,
  onSuccess,
}: {
  user: TeamUser | null
  open: boolean
  onClose: () => void
  branches: { id: string; name: string }[]
  onSuccess: () => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("FIELD_OFFICER")
  const [branchId, setBranchId] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (open && user) {
      setName(user.name || "")
      setEmail(user.email || "")
      setPassword("") // keep blank unless changing
      setRole(user.role || "FIELD_OFFICER")
      setBranchId(user.branch?.id || "")
      setShowPassword(false)
      setError("")
    }
  }, [open, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    try {
      setSubmitting(true)
      setError("")

      const res = await fetch(`/api/team/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password: password || undefined,
          role,
          branchId: branchId || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to update team member.")
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[440px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-[17px] font-semibold text-navy-900">Edit Team Member</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">Update credentials and assignments</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {error && (
            <div className="text-[13px] text-danger-600 bg-danger-50 rounded-lg px-4 py-3 border border-danger-100">
              {error}
            </div>
          )}

          <Field label="Full Name" required>
            <input
              required
              placeholder="E.g. Kamal Perera"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Email Address (Login ID)" required>
            <input
              required
              type="email"
              placeholder="e.g. kamal@microfinance.lk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="System Role" required>
            <div className="relative">
              <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`${inputCls} appearance-none pr-10`}
              >
                <option value="FIELD_OFFICER">Field Officer</option>
                <option value="BRANCH_MANAGER">Branch Manager</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="HEAD_OFFICE">Head Office</option>
                <option value="SYSTEM_ADMIN">System Admin</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </Field>

          <Field label="Assign to Branch" required={role === "FIELD_OFFICER" || role === "BRANCH_MANAGER"}>
            <div className="relative">
              <select
                required={role === "FIELD_OFFICER" || role === "BRANCH_MANAGER"}
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className={`${inputCls} appearance-none pr-10`}
              >
                <option value="">{role === "SYSTEM_ADMIN" || role === "HEAD_OFFICE" ? "All Branches (Global Access)" : "Select branch…"}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </Field>

          <Field label="New Password (Optional)">
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Leave blank to keep current"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputCls} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
              className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-[14px] font-medium hover:bg-brand-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </button>
          </div>
        </form>
      </aside>
    </>
  )
}

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

function RoleBadge({ role }: { role: string }) {
  switch (role) {
    case "SYSTEM_ADMIN":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/50">
          System Admin
        </span>
      )
    case "HEAD_OFFICE":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-blue-50 text-blue-700 border border-blue-200/50">
          Head Office
        </span>
      )
    case "BRANCH_MANAGER":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/50">
          Branch Manager
        </span>
      )
    case "FIELD_OFFICER":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-purple-50 text-purple-700 border border-purple-200/50">
          Field Officer
        </span>
      )
    case "ACCOUNTANT":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-amber-50 text-amber-700 border border-amber-200/50">
          Accountant
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-slate-50 text-slate-600 border border-slate-200/50">
          {role.replace(/_/g, " ")}
        </span>
      )
  }
}

// ─── Add Member Drawer ─────────────────────────────────────────────────────────
function AddTeamMemberDrawer({
  open,
  onClose,
  branches,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  branches: { id: string; name: string }[]
  onSuccess: () => void
}) {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState("FIELD_OFFICER")
  const [branchId, setBranchId] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setName("")
      setEmail("")
      setPassword("")
      setRole("FIELD_OFFICER")
      setBranchId("")
      setShowPassword(false)
      setError("")
      setTimeout(() => nameRef.current?.focus(), 120)
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError("")

      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          role,
          branchId: branchId || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to create team member.")
      }

      onSuccess()
      onClose()
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
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[440px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-[17px] font-semibold text-navy-900">Add Team Member</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">Create user credentials and assign roles</p>
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
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="Email Address (Login ID)" required>
            <input
              required
              type="email"
              placeholder="e.g. kamal@microfinance.lk"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </Field>

          <Field label="System Role" required>
            <div className="relative">
              <select
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`${inputCls} appearance-none pr-10`}
              >
                <option value="FIELD_OFFICER">Field Officer</option>
                <option value="BRANCH_MANAGER">Branch Manager</option>
                <option value="ACCOUNTANT">Accountant</option>
                <option value="HEAD_OFFICE">Head Office</option>
                <option value="SYSTEM_ADMIN">System Admin</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </Field>

          <Field label="Assign to Branch" required={role === "FIELD_OFFICER" || role === "BRANCH_MANAGER"}>
            <div className="relative">
              <select
                required={role === "FIELD_OFFICER" || role === "BRANCH_MANAGER"}
                value={branchId}
                onChange={(e) => setBranchId(e.target.value)}
                className={`${inputCls} appearance-none pr-10`}
              >
                <option value="">{role === "SYSTEM_ADMIN" || role === "HEAD_OFFICE" ? "All Branches (Global Access)" : "Select branch…"}</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </Field>

          <Field label="Initial Password" required>
            <div className="relative">
              <input
                required
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${inputCls} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
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
              className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-[14px] font-medium hover:bg-brand-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create Member"
              )}
            </button>
          </div>
        </form>
      </aside>
    </>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
interface TeamUser {
  id: string
  name: string | null
  email: string | null
  role: string
  createdAt: Date | string
  branch?: { id?: string; name: string } | null
}

export function TeamManagement({
  users: initialUsers,
  branches,
  quota,
}: {
  users: TeamUser[]
  branches: { id: string; name: string }[]
  quota: { current: number; max: number }
}) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<TeamUser | null>(null)
  const [search, setSearch] = useState("")
  const [branchFilter, setBranchFilter] = useState("")
  const [roleFilter, setRoleFilter] = useState("")
  const [page, setPage] = useState(1)
  const limit = 10

  const filtered = initialUsers.filter((u) => {
    const q = search.toLowerCase()
    const matchSearch =
      !q ||
      (u.name ?? "").toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      u.role.toLowerCase().replace(/_/g, " ").includes(q)

    const userBranch = u.branch?.name ?? (u.role === "SYSTEM_ADMIN" || u.role === "HEAD_OFFICE" ? "All Branches" : "")
    const matchBranch = !branchFilter || userBranch === branchFilter
    const matchRole = !roleFilter || u.role === roleFilter

    return matchSearch && matchBranch && matchRole
  })

  const total = filtered.length
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const paginated = filtered.slice((page - 1) * limit, page * limit)

  const isQuotaReached = quota.current >= quota.max

  return (
    <div className="flex flex-col h-full">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-navy-900 tracking-tight">Team</h1>
          <p className="text-[14px] text-slate-500 mt-0.5">
            {initialUsers.length} team member{initialUsers.length !== 1 ? "s" : ""} across {branches.length} branch{branches.length !== 1 ? "es" : ""} ·{" "}
            <span className={isQuotaReached ? "text-danger-600 font-medium" : "font-medium text-navy-800"}>
              {quota.current} / {quota.max} Seats Used
            </span>
          </p>
        </div>
        <button
          onClick={() => setDrawerOpen(true)}
          disabled={isQuotaReached}
          title={isQuotaReached ? "Seat quota limit reached. Upgrade in Billing to add more members." : undefined}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-[14px] font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            placeholder="Search by name, email, or role..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="w-full pl-9 pr-4 py-2.5 text-[14px] bg-white border border-gray-200 rounded-lg text-navy-900 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
          />
        </div>

        <div className="relative">
          <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={branchFilter}
            onChange={(e) => {
              setBranchFilter(e.target.value)
              setPage(1)
            }}
            className="pl-9 pr-8 py-2.5 text-[14px] bg-white border border-gray-200 rounded-lg text-navy-900 appearance-none outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 cursor-pointer transition-all"
          >
            <option value="">All Branches</option>
            {branches.map((b) => (
              <option key={b.id} value={b.name}>{b.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>

        <div className="relative">
          <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value)
              setPage(1)
            }}
            className="pl-9 pr-8 py-2.5 text-[14px] bg-white border border-gray-200 rounded-lg text-navy-900 appearance-none outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 cursor-pointer transition-all"
          >
            <option value="">All Roles</option>
            <option value="SYSTEM_ADMIN">System Admin</option>
            <option value="HEAD_OFFICE">Head Office</option>
            <option value="BRANCH_MANAGER">Branch Manager</option>
            <option value="FIELD_OFFICER">Field Officer</option>
            <option value="ACCOUNTANT">Accountant</option>
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left py-3 px-5 text-[12px] font-semibold text-slate-500 uppercase tracking-wider w-[280px]">Team Member</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Assigned Branch</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Joined Date</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="inline-flex flex-col items-center gap-3 text-slate-400">
                      <Users className="w-10 h-10 text-slate-200" />
                      <div>
                        <p className="text-[15px] font-medium text-slate-600">No team members found</p>
                        <p className="text-[13px] text-slate-400 mt-1">
                          {search || branchFilter || roleFilter ? "Try adjusting your filters" : "Add your first team member to get started"}
                        </p>
                      </div>
                      {!search && !branchFilter && !roleFilter && !isQuotaReached && (
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
                paginated.map((user) => {
                  const color = avatarColor(user.id)
                  const branchName = user.branch?.name || (user.role === "SYSTEM_ADMIN" || user.role === "HEAD_OFFICE" ? "All Branches" : "Unassigned")
                  return (
                    <tr key={user.id} className="hover:bg-gray-50/70 transition-colors group">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-[12px] font-bold text-white">{initials(user.name || "")}</span>
                          </div>
                          <div>
                            <span className="text-[14px] font-semibold text-navy-900">
                              {user.name || "Unnamed User"}
                            </span>
                            <p className="text-[12px] text-slate-400 mt-0.5">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[13px] text-slate-600">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {branchName}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="text-[13px] text-slate-500">
                          {new Date(user.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium bg-success-50 text-success-700 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
                          Active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setEditingUser(user)}
                          className="px-3 py-1.5 text-[13px] font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 rounded-md transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Table Footer with Pagination ── */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
          <span className="text-[13px] text-slate-500">
            Showing {paginated.length} of {total} team members
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 rounded-md border border-gray-200 text-[13px] font-medium text-slate-600 disabled:opacity-50 hover:bg-gray-100 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-md border border-gray-200 text-[13px] font-medium text-slate-600 disabled:opacity-50 hover:bg-gray-100 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* ── Add Member Drawer ── */}
      <AddTeamMemberDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        branches={branches}
        onSuccess={() => {
          window.location.reload()
        }}
      />
      <EditTeamMemberDrawer
        user={editingUser}
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        branches={branches}
        onSuccess={() => {
          window.location.reload()
        }}
      />
    </div>
  )
}
