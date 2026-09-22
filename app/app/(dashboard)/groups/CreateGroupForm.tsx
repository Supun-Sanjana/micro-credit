"use client"

import { useState, useTransition } from "react"
import { createGroup } from "@/app/actions/groups"

export function CreateGroupForm({ centres }: { centres: any[] }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    centreId: "",
    groupNumber: "",
    name: "",
    meetingDay: "",
    meetingTime: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    startTransition(async () => {
      const result = await createGroup({
        centreId: formData.centreId,
        groupNumber: parseInt(formData.groupNumber, 10),
        name: formData.name,
        meetingDay: formData.meetingDay || undefined,
        meetingTime: formData.meetingTime || undefined,
      })

      if (result?.error) {
        setError(result.error)
      } else {
        setFormData({ centreId: "", groupNumber: "", name: "", meetingDay: "", meetingTime: "" })
      }
    })
  }

  return (
    <div className="bg-paper-white rounded-[20px] shadow-subtle-3 p-[32px]">
      <h2 className="text-[20px] font-sans font-medium text-ink-black mb-6">
        Create Group
      </h2>
      {error && <div className="mb-4 text-red-600 text-sm">{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-[15px] text-ink-black font-sans ml-1">Centre</label>
          <select 
            required
            value={formData.centreId}
            onChange={e => setFormData({...formData, centreId: e.target.value})}
            className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black appearance-none"
          >
            <option value="" disabled className="text-smoke-gray">Select Centre</option>
            {centres.map(c => (
              <option key={c.id} value={c.id}>{c.name} {c.branch?.name ? `(${c.branch.name})` : ''}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[15px] text-ink-black font-sans ml-1">Group Number</label>
          <input 
            required
            type="number"
            min="1"
            placeholder="E.g. 1"
            value={formData.groupNumber}
            onChange={e => setFormData({...formData, groupNumber: e.target.value})}
            className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[15px] text-ink-black font-sans ml-1">Group Name</label>
          <input 
            required
            placeholder="E.g. Araliya"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[15px] text-ink-black font-sans ml-1">Meeting Day</label>
          <select 
            value={formData.meetingDay}
            onChange={e => setFormData({...formData, meetingDay: e.target.value})}
            className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black appearance-none"
          >
            <option value="" className="text-smoke-gray">Not Set</option>
            <option value="MONDAY">Monday</option>
            <option value="TUESDAY">Tuesday</option>
            <option value="WEDNESDAY">Wednesday</option>
            <option value="THURSDAY">Thursday</option>
            <option value="FRIDAY">Friday</option>
            <option value="SATURDAY">Saturday</option>
            <option value="SUNDAY">Sunday</option>
          </select>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[15px] text-ink-black font-sans ml-1">Meeting Time</label>
          <input 
            type="time"
            value={formData.meetingTime}
            onChange={e => setFormData({...formData, meetingTime: e.target.value})}
            className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black"
          />
        </div>

        <div className="pt-4">
          <button 
            type="submit"
            disabled={isPending}
            className="w-full flex items-center justify-center bg-ink-black text-paper-white rounded-full px-[20px] py-[14px] text-[16px] font-sans transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? "Creating..." : "Create Group"}
          </button>
        </div>
      </form>
    </div>
  )
}
