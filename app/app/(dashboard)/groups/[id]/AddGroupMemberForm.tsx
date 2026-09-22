"use client"

import { useState, useTransition } from "react"
import { addGroupMember } from "@/app/actions/groups"

export function AddGroupMemberForm({ groupId, availableMembers }: { groupId: string, availableMembers: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [memberId, setMemberId] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!memberId) return
    setError(null)
    
    startTransition(async () => {
      const result = await addGroupMember(groupId, memberId, "MEMBER")
      if (result?.error) {
        setError(result.error)
      } else {
        setMemberId("")
      }
    })
  }

  return (
    <div className="bg-paper-white rounded-[20px] shadow-subtle-3 p-[32px]">
      <h2 className="text-[20px] font-sans font-medium text-ink-black mb-6">
        Add Member
      </h2>
      {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[15px] text-ink-black font-sans ml-1">Select Member</label>
          <select 
            required
            value={memberId}
            onChange={e => setMemberId(e.target.value)}
            className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black appearance-none"
          >
            <option value="" disabled className="text-smoke-gray">Choose available member</option>
            {availableMembers.map(m => (
              <option key={m.id} value={m.id}>{m.name} ({m.memberNumber || 'N/A'})</option>
            ))}
          </select>
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            disabled={isPending || !memberId || availableMembers.length === 0}
            className="w-full flex items-center justify-center bg-ink-black text-paper-white rounded-full px-[20px] py-[14px] text-[16px] font-sans transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Adding..." : "Add Member"}
          </button>
        </div>
      </form>
    </div>
  )
}
