"use client"

import { useState } from "react"
import Link from "next/link"
import { mockMembers, mockCentres } from "@/lib/mock-data"
import { Member } from "@/lib/types"

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>(mockMembers)
  
  const [formData, setFormData] = useState({ 
    centreId: "", 
    name: "", 
    nic: "", 
    address: "", 
    contact1: "", 
    groupNumber: "" 
  })

  const [searchTerm, setSearchTerm] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const centre = mockCentres.find(c => c.id === formData.centreId)
    const newMember: Member = {
      id: `mem_${Date.now()}`,
      memberNumber: `${centre?.centreCode}/${members.length + 1}`.padStart(3, '0'),
      name: formData.name,
      organizationId: 'mock-org-id',
      nic: formData.nic,
      address: formData.address,
      contact1: formData.contact1,
      contact2: null,
      groupNumber: formData.groupNumber ? parseInt(formData.groupNumber) : null,
      centreId: formData.centreId,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    setMembers([...members, newMember])
    setFormData({ centreId: "", name: "", nic: "", address: "", contact1: "", groupNumber: "" })
  }

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.nic && m.nic.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          m.memberNumber.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="flex flex-col gap-[80px]">
      
      {/* Hero Section */}
      <div className="flex flex-col gap-4">
        <h1 
          className="text-[44px] leading-[1.3] text-ink-black font-serif font-normal"
          style={{ letterSpacing: '-0.66px' }}
        >
          Members Database
        </h1>
        <p className="text-[17px] text-slate-gray max-w-[600px] leading-[1.35]">
          Manage community members across all operational centres.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[80px]">
        
        {/* Registration Form (Floating Product Artifact) */}
        <div className="lg:col-span-4 h-fit">
          <div className="bg-paper-white rounded-[20px] shadow-subtle-3 p-[32px]">
            <h2 className="text-[20px] font-sans font-medium text-ink-black mb-6">
              Register Member
            </h2>
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
                  {mockCentres.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.centreCode})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-ink-black font-sans ml-1">Full Name</label>
                <input 
                  required
                  placeholder="E.g. Kamal Perera"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-ink-black font-sans ml-1">National ID</label>
                <input 
                  placeholder="Optional"
                  value={formData.nic}
                  onChange={e => setFormData({...formData, nic: e.target.value})}
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-ink-black font-sans ml-1">Contact</label>
                <input 
                  required
                  placeholder="077XXXXXXX"
                  value={formData.contact1}
                  onChange={e => setFormData({...formData, contact1: e.target.value})}
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-ink-black font-sans ml-1">Group Number</label>
                <input 
                  type="number"
                  min="1"
                  max="6"
                  placeholder="1-6"
                  value={formData.groupNumber}
                  onChange={e => setFormData({...formData, groupNumber: e.target.value})}
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black"
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full flex items-center justify-center bg-ink-black text-paper-white rounded-full px-[20px] py-[14px] text-[16px] font-sans transition-opacity hover:opacity-90"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Directory List (Neutral Card) */}
        <div className="lg:col-span-8">
          <div className="bg-mist-gray rounded-[24px] p-[32px] md:p-[40px]">
            
            {/* Search Input matching "Composer" style */}
            <div className="mb-8">
              <input 
                placeholder="Search by name, NIC, or member no..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-[480px] bg-paper-white border border-[#ececec] rounded-[16px] p-[16px] text-[16px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black transition-colors"
              />
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Member No.</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Name</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">NIC</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Centre</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Group</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map(m => {
                    const centre = mockCentres.find(c => c.id === m.centreId)
                    return (
                      <tr key={m.id} className="border-b border-border/40 last:border-0">
                        <td className="py-5 pr-4">
                          <Link href={`/members/${m.id}`} className="text-[16px] font-sans text-ink-black hover:text-slate-gray transition-colors">
                            {m.memberNumber}
                          </Link>
                        </td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-ink-black">
                          {m.name}
                        </td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-slate-gray">
                          {m.nic || '—'}
                        </td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-slate-gray">
                          {centre?.name || '—'}
                        </td>
                        <td className="py-5 pr-4">
                           <span className="text-[14px] font-sans text-ash-gray font-normal">
                            {m.groupNumber ? `Group ${m.groupNumber}` : '—'}
                           </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              {filteredMembers.length === 0 && (
                <div className="text-center py-12 text-[15px] text-slate-gray">
                  No members found matching your search.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
