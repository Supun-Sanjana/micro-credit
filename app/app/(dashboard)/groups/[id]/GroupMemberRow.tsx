"use client"

import { useState, useTransition } from "react"
import { changeGroupMemberRole, removeGroupMember } from "@/app/actions/groups"
import Link from "next/link"

export function GroupMemberRow({ membership }: { membership: any }) {
  const [isPendingRole, startTransitionRole] = useTransition()
  const [isPendingRemove, startTransitionRemove] = useTransition()

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as any
    startTransitionRole(async () => {
      await changeGroupMemberRole(membership.id, newRole)
    })
  }

  const handleRemove = () => {
    if (!confirm(`Are you sure you want to remove ${membership.member.name} from this group?`)) return
    startTransitionRemove(async () => {
      await removeGroupMember(membership.id)
    })
  }

  return (
    <tr className="border-b border-border/40 last:border-0">
      <td className="py-5 pr-4">
        <Link href={`/app/members/${membership.member.id}`} className="text-[16px] font-sans text-navy-900 hover:text-slate-500 transition-colors">
          {membership.member.memberNumber || 'N/A'}
        </Link>
      </td>
      <td className="py-5 pr-4 text-[16px] font-sans text-navy-900">
        {membership.member.name}
      </td>
      <td className="py-5 pr-4 text-[16px] font-sans text-slate-500">
        {membership.member.contact1 || '—'}
      </td>
      <td className="py-5 pr-4 text-[16px] font-sans text-slate-500">
        {new Date(membership.joinedAt).toLocaleDateString()}
      </td>
      <td className="py-5 pr-4">
        <select
          value={membership.role}
          onChange={handleRoleChange}
          disabled={isPendingRole || membership.status !== "ACTIVE"}
          className="bg-transparent text-[14px] font-sans text-navy-900 border border-[#ececec] rounded-[8px] px-[8px] py-[4px] outline-none"
        >
          <option value="MEMBER">Member</option>
          <option value="LEADER">Leader</option>
          <option value="ASSISTANT_LEADER">Assistant Leader</option>
        </select>
      </td>
      <td className="py-5 pr-4">
        <span className={`text-[12px] font-sans px-2 py-1 rounded-full ${
          membership.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {membership.status}
        </span>
      </td>
      <td className="py-5 pr-4">
        {membership.status === "ACTIVE" && (
          <button
            onClick={handleRemove}
            disabled={isPendingRemove}
            className="text-red-600 text-[14px] hover:underline disabled:opacity-50"
          >
            {isPendingRemove ? 'Removing...' : 'Remove'}
          </button>
        )}
      </td>
    </tr>
  )
}
