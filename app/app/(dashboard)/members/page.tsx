"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Member, Centre } from "@/lib/types"

export default function MembersPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [centres, setCentres] = useState<Centre[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const [formData, setFormData] = useState({ 
    centreId: "", 
    name: "", 
    nic: "", 
    address: "", 
    contact1: "", 
    groupNumber: "" 
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [searchTerm, setSearchTerm] = useState("")

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [membersRes, centresRes] = await Promise.all([
        fetch('/api/members'),
        fetch('/api/centres')
      ])
      
      if (membersRes.ok) {
        setMembers(await membersRes.json())
      }
      if (centresRes.ok) {
        setCentres(await centresRes.json())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          groupNumber: formData.groupNumber ? parseInt(formData.groupNumber) : undefined
        })
      })
      if (res.ok) {
        setFormData({ centreId: "", name: "", nic: "", address: "", contact1: "", groupNumber: "" })
        const membersData = await fetch('/api/members')
        if (membersData.ok) setMembers(await membersData.json())
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (m.nic && m.nic.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (m.memberNumber && m.memberNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesSearch
  })

  return (
    <div className="flex flex-col gap-8 lg:gap-[48px]">
      
      {/* Hero Section */}
      <div className="flex flex-col gap-4">
        <h1 
          className="text-[44px] leading-[1.3] text-navy-900 font-serif font-normal"
          style={{ letterSpacing: '-0.66px' }}
        >
          Members Database
        </h1>
        <p className="text-[17px] text-slate-500 max-w-[600px] leading-[1.35]">
          Manage community members across all operational centres.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-[48px]">
        
        {/* Registration Form (Floating Product Artifact) */}
        <div className="lg:col-span-4 h-fit">
          <div className="bg-white rounded-[20px] shadow-subtle-3 p-[32px]">
            <h2 className="text-[20px] font-sans font-medium text-navy-900 mb-6">
              Register Member
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-navy-900 font-sans ml-1">Centre</label>
                <select 
                  required
                  value={formData.centreId}
                  onChange={e => setFormData({...formData, centreId: e.target.value})}
                  className="bg-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-navy-900 outline-none focus:border-navy-900 appearance-none"
                >
                  <option value="" disabled className="text-slate-300">Select Centre</option>
                  {centres.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.centreCode})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-navy-900 font-sans ml-1">Full Name</label>
                <input 
                  required
                  placeholder="E.g. Kamal Perera"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="bg-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-navy-900 placeholder:text-slate-300 outline-none focus:border-navy-900"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-navy-900 font-sans ml-1">National ID</label>
                <input 
                  placeholder="Optional"
                  value={formData.nic}
                  onChange={e => setFormData({...formData, nic: e.target.value})}
                  className="bg-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-navy-900 placeholder:text-slate-300 outline-none focus:border-navy-900"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-navy-900 font-sans ml-1">Contact</label>
                <input 
                  required
                  placeholder="077XXXXXXX"
                  value={formData.contact1}
                  onChange={e => setFormData({...formData, contact1: e.target.value})}
                  className="bg-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-navy-900 placeholder:text-slate-300 outline-none focus:border-navy-900"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-navy-900 font-sans ml-1">Group Number</label>
                <input 
                  type="number"
                  min="1"
                  max="6"
                  placeholder="1-6"
                  value={formData.groupNumber}
                  onChange={e => setFormData({...formData, groupNumber: e.target.value})}
                  className="bg-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-navy-900 placeholder:text-slate-300 outline-none focus:border-navy-900"
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center bg-navy-900 text-white rounded-full px-[20px] py-[14px] text-[16px] font-sans transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? "Registering..." : "Register"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Directory List (Neutral Card) */}
        <div className="lg:col-span-8">
          <div className="bg-slate-50 rounded-[24px] p-[32px] md:p-[40px]">
            
            {/* Search Input matching "Composer" style */}
            <div className="mb-8">
              <input 
                placeholder="Search by name, NIC, or member no..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-[480px] bg-white border border-[#ececec] rounded-[16px] p-[16px] text-[16px] text-navy-900 placeholder:text-slate-300 outline-none focus:border-navy-900 transition-colors"
              />
            </div>

            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Member No.</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Name</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">NIC</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Centre</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Group</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-[15px] text-slate-500">
                        <div className="inline-block animate-spin w-5 h-5 border-2 border-navy-900 border-t-transparent rounded-full"></div>
                      </td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-[15px] text-slate-500">
                        No members found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map(m => {
                      const centre = centres.find(c => c.id === m.centreId)
                      return (
                        <tr key={m.id} className="border-b border-border/40 last:border-0">
                          <td className="py-5 pr-4">
                            <Link href={`/app/members/${m.id}`} className="text-[16px] font-sans text-navy-900 hover:text-slate-500 transition-colors">
                              {m.memberNumber}
                            </Link>
                          </td>
                          <td className="py-5 pr-4 text-[16px] font-sans text-navy-900">
                            {m.name}
                          </td>
                          <td className="py-5 pr-4 text-[16px] font-sans text-slate-500">
                            {m.nic || '—'}
                          </td>
                          <td className="py-5 pr-4 text-[16px] font-sans text-slate-500">
                            {centre?.name || '—'}
                          </td>
                          <td className="py-5 pr-4">
                             <span className="text-[14px] font-sans text-slate-400 font-normal">
                              {m.groupNumber ? `Group ${m.groupNumber}` : '—'}
                             </span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
