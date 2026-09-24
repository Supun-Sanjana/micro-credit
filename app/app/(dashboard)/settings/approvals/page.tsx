"use client"

import { useState, useEffect, useTransition } from "react"
import { ShieldCheck, Plus, Trash2, Edit2, AlertCircle } from "lucide-react"
import { Role } from "@prisma/client"
import { getApprovalRules, saveApprovalRule, deleteApprovalRule } from "@/app/actions/approvals"

export default function ApprovalsSettingsPage() {
  const [rules, setRules] = useState<any[]>([])
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  
  const [editId, setEditId] = useState<string | null>(null)
  const [minAmount, setMinAmount] = useState<string>("0")
  const [maxAmount, setMaxAmount] = useState<string>("50000")
  const [requiredRole, setRequiredRole] = useState<Role>("BRANCH_MANAGER")

  const loadRules = () => {
    startTransition(async () => {
      const data = await getApprovalRules()
      setRules(data)
    })
  }

  useEffect(() => {
    loadRules()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        await saveApprovalRule({
          id: editId || undefined,
          minAmount: Number(minAmount),
          maxAmount: Number(maxAmount),
          requiredRole
        })
        setShowForm(false)
        setEditId(null)
        loadRules()
      } catch (err: any) {
        alert(err.message)
      }
    })
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this approval rule?")) return
    startTransition(async () => {
      await deleteApprovalRule(id)
      loadRules()
    })
  }

  const openEdit = (r: any) => {
    setEditId(r.id)
    setMinAmount(r.minAmount.toString())
    setMaxAmount(r.maxAmount.toString())
    setRequiredRole(r.requiredRole)
    setShowForm(true)
  }

  const openNew = () => {
    setEditId(null)
    setMinAmount("0")
    setMaxAmount("100000")
    setRequiredRole("BRANCH_MANAGER")
    setShowForm(true)
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-[32px] leading-[1.3] text-ink-black font-serif font-normal" style={{ letterSpacing: '-0.66px' }}>
            Credit Approval Workflow
          </h1>
          <p className="text-[17px] text-slate-gray leading-[1.35] mt-2">
            Configure tiered matrices for loan verification limits.
          </p>
        </div>
        {!showForm && (
          <button 
            onClick={openNew}
            className="flex items-center gap-2 bg-ink-black text-paper-white px-5 py-2.5 rounded-xl text-[15px] font-medium"
          >
            <Plus className="w-4 h-4" /> Add Rule
          </button>
        )}
      </div>

      {rules.length === 0 && !showForm && (
        <div className="bg-paper-white rounded-[24px] border border-[#ececec] p-12 shadow-subtle-1 text-center">
          <ShieldCheck className="w-12 h-12 text-slate-gray mx-auto mb-4" />
          <h3 className="text-[18px] font-medium text-ink-black mb-2">No Approval Rules Configured</h3>
          <p className="text-[15px] text-slate-gray mb-6">
            When no rules exist, the system defaults to requiring Branch Manager or Head Office approval for all loans.
          </p>
          <button 
            onClick={openNew}
            className="bg-ink-black text-paper-white px-6 py-3 rounded-xl text-[15px] font-medium"
          >
            Create Your First Rule
          </button>
        </div>
      )}

      {showForm && (
        <div className="bg-paper-white rounded-[24px] border border-[#ececec] p-8 shadow-subtle-1">
          <h2 className="text-[20px] font-medium text-ink-black mb-6">
            {editId ? "Edit Approval Rule" : "Create Approval Rule"}
          </h2>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[14px] font-medium text-ink-black">Min Amount (LKR)</label>
                <input 
                  type="number" 
                  value={minAmount}
                  onChange={e => setMinAmount(e.target.value)}
                  className="w-full bg-mist-gray/30 border border-[#ececec] rounded-xl px-4 py-3 outline-none focus:border-ink-black"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[14px] font-medium text-ink-black">Max Amount (LKR)</label>
                <input 
                  type="number" 
                  value={maxAmount}
                  onChange={e => setMaxAmount(e.target.value)}
                  className="w-full bg-mist-gray/30 border border-[#ececec] rounded-xl px-4 py-3 outline-none focus:border-ink-black"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[14px] font-medium text-ink-black">Required Role</label>
              <select
                value={requiredRole}
                onChange={e => setRequiredRole(e.target.value as Role)}
                className="w-full bg-mist-gray/30 border border-[#ececec] rounded-xl px-4 py-3 outline-none focus:border-ink-black"
              >
                <option value="BRANCH_MANAGER">Branch Manager</option>
                <option value="HEAD_OFFICE">Head Office (Regional Manager)</option>
                <option value="SYSTEM_ADMIN">System Administrator</option>
              </select>
              <p className="text-[13px] text-slate-gray mt-1">
                Roles higher than the selected role can automatically approve the loan.
              </p>
            </div>

            <div className="flex gap-4 pt-4 border-t border-[#ececec]">
              <button 
                type="submit" 
                disabled={isPending}
                className="bg-ink-black text-paper-white px-6 py-2.5 rounded-xl text-[15px] font-medium disabled:opacity-50"
              >
                {isPending ? "Saving..." : "Save Rule"}
              </button>
              <button 
                type="button" 
                onClick={() => setShowForm(false)}
                className="bg-transparent text-slate-gray px-6 py-2.5 rounded-xl text-[15px] font-medium hover:bg-mist-gray"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!showForm && rules.length > 0 && (
        <div className="bg-paper-white rounded-[24px] border border-[#ececec] overflow-hidden shadow-subtle-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-mist-gray/30 border-b border-border/40">
                <th className="p-5 font-sans text-[14px] text-slate-gray font-normal">Tier Range</th>
                <th className="p-5 font-sans text-[14px] text-slate-gray font-normal">Required Approval Level</th>
                <th className="p-5 font-sans text-[14px] text-slate-gray font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rules.map(r => (
                <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-[#fafafa] transition-colors">
                  <td className="p-5 text-[15px] font-medium text-ink-black">
                    LKR {r.minAmount.toLocaleString()} — LKR {r.maxAmount.toLocaleString()}
                  </td>
                  <td className="p-5">
                    <span className={`px-2.5 py-1 rounded-md text-[12px] font-medium ${
                      r.requiredRole === 'SYSTEM_ADMIN' ? 'bg-[#fce8e6] text-[#c5221f]' : 
                      r.requiredRole === 'HEAD_OFFICE' ? 'bg-[#feefe6] text-sienna-brown' : 
                      'bg-[#e6f4ea] text-[#137333]'
                    }`}>
                      {r.requiredRole.replace("_", " ")}
                    </span>
                  </td>
                  <td className="p-5 flex justify-end gap-3">
                    <button onClick={() => openEdit(r)} className="text-slate-gray hover:text-ink-black transition-colors">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(r.id)} className="text-slate-gray hover:text-[#c5221f] transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  )
}
