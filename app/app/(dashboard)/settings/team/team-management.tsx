"use client"

import { useState } from "react"
import { Loader2, Plus, UserPlus, Eye, EyeOff } from "lucide-react"

export function TeamManagement({ users, branches, quota }: { users: any[], branches: any[], quota: { current: number, max: number } }) {
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [branchId, setBranchId] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, branchId: branchId || undefined }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || "Failed to create team member.")
      }

      window.location.reload()
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[24px] font-medium text-ink-black">Team Management</h2>
          <p className="text-[15px] text-slate-gray mt-1">
            Manage your company's Field Officers and system users.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[14px] text-slate-gray">
            {quota.current} / {quota.max} Seats Used
          </span>
          {quota.current < quota.max && !showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-ink-black text-paper-white px-5 py-2.5 rounded-full text-[14px] font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </button>
          )}
        </div>
      </div>

      {showForm && (
        <div className="bg-mist-gray/30 rounded-[24px] p-8 border border-border/40">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[18px] font-medium text-ink-black flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Add New Field Officer
            </h3>
            <button onClick={() => setShowForm(false)} className="text-[14px] text-slate-gray hover:text-ink-black">
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 rounded-[12px] bg-[#fce8e6] text-[#c5221f] text-[14px] font-medium">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[14px] font-medium text-ink-black ml-1">Full Name</label>
                <input
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-paper-white border border-[#ececec] rounded-[16px] px-4 py-3 text-[15px] text-ink-black outline-none focus:border-ink-black"
                  placeholder="e.g. Kamal Perera"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-medium text-ink-black ml-1">Email Address (Login ID)</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-paper-white border border-[#ececec] rounded-[16px] px-4 py-3 text-[15px] text-ink-black outline-none focus:border-ink-black"
                  placeholder="e.g. kamal@micro.local"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-[14px] font-medium text-ink-black ml-1">Initial Password</label>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-paper-white border border-[#ececec] rounded-[16px] px-4 py-3 pr-12 text-[15px] text-ink-black outline-none focus:border-ink-black"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-gray hover:text-ink-black transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-[14px] font-medium text-ink-black ml-1">Assign to Branch</label>
                <select
                  required
                  value={branchId}
                  onChange={e => setBranchId(e.target.value)}
                  className="w-full bg-paper-white border border-[#ececec] rounded-[16px] px-4 py-3 text-[15px] text-ink-black outline-none focus:border-ink-black appearance-none"
                >
                  <option value="" disabled>Select Branch</option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-ink-black text-paper-white px-6 py-3 rounded-full text-[14px] font-medium hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Account
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-paper-white rounded-[24px] border border-[#ececec] shadow-subtle-3 overflow-hidden">
        <table className="w-full">
          <thead className="bg-mist-gray/50 border-b border-[#ececec]">
            <tr>
              <th className="px-6 py-4 text-left text-[12px] font-medium uppercase tracking-wider text-ash-gray">Name</th>
              <th className="px-6 py-4 text-left text-[12px] font-medium uppercase tracking-wider text-ash-gray">Email</th>
              <th className="px-6 py-4 text-left text-[12px] font-medium uppercase tracking-wider text-ash-gray">Role</th>
              <th className="px-6 py-4 text-left text-[12px] font-medium uppercase tracking-wider text-ash-gray">Assigned Branch</th>
              <th className="px-6 py-4 text-left text-[12px] font-medium uppercase tracking-wider text-ash-gray">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#ececec]">
            {users.map((user: any) => (
              <tr key={user.id} className="hover:bg-fog-white transition-colors">
                <td className="px-6 py-4 text-[15px] text-ink-black font-medium">{user.name || "Unassigned"}</td>
                <td className="px-6 py-4 text-[15px] text-slate-gray">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium ${user.role === 'SYSTEM_ADMIN' ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-mist-gray text-slate-gray'}`}>
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 text-[15px] text-slate-gray">
                  {user.branch?.name || (user.role === 'SYSTEM_ADMIN' ? "All Branches" : "Unassigned")}
                </td>
                <td className="px-6 py-4 text-[15px] text-slate-gray">
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
