"use client"

import { useState, useEffect } from "react"
import { Branch } from "@/lib/types"

export default function BranchesPage() {
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [formData, setFormData] = useState({ code: "", name: "", address: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchBranches = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/branches')
      if (res.ok) {
        const data = await res.json()
        setBranches(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      const res = await fetch('/api/branches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setFormData({ code: "", name: "", address: "" })
        fetchBranches()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-8 lg:gap-[48px]">
      
      {/* Hero Section */}
      <div className="flex flex-col gap-4">
        <h1 
          className="text-[44px] leading-[1.3] text-ink-black font-serif font-normal"
          style={{ letterSpacing: '-0.66px' }}
        >
          Branches
        </h1>
        <p className="text-[17px] text-slate-gray max-w-[600px] leading-[1.35]">
          Manage and review regional branch locations across the organization.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-[48px]">
        
        {/* Registration Form (Floating Product Artifact) */}
        <div className="lg:col-span-4 h-fit">
          <div className="bg-paper-white rounded-[20px] shadow-subtle-3 p-[32px]">
            <h2 className="text-[20px] font-sans font-medium text-ink-black mb-6">
              New Branch
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-ink-black font-sans ml-1">Branch Code</label>
                <input 
                  required
                  value={formData.code}
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  placeholder="e.g. SA01"
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-ink-black font-sans ml-1">Branch Name</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. GALLE"
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-ink-black font-sans ml-1">Address</label>
                <input 
                  value={formData.address}
                  onChange={e => setFormData({...formData, address: e.target.value})}
                  placeholder="Street Address"
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black"
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center bg-ink-black text-paper-white rounded-full px-[20px] py-[14px] text-[16px] font-sans transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? "Creating..." : "Create Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* List (Neutral Card) */}
        <div className="lg:col-span-8">
          <div className="bg-mist-gray rounded-[24px] p-[32px] md:p-[40px]">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40">
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Code</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Branch Name</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={3} className="text-center py-12 text-[15px] text-slate-gray">
                        <div className="inline-block animate-spin w-5 h-5 border-2 border-ink-black border-t-transparent rounded-full"></div>
                      </td>
                    </tr>
                  ) : branches.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-12 text-[15px] text-slate-gray">
                        No branches registered.
                      </td>
                    </tr>
                  ) : (
                    branches.map((b) => (
                      <tr key={b.id} className="border-b border-border/40 last:border-0">
                        <td className="py-5 pr-4 text-[16px] font-sans font-medium text-ink-black">
                          {b.code}
                        </td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-ink-black">
                          {b.name}
                        </td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-slate-gray">
                          {b.address || '—'}
                        </td>
                      </tr>
                    ))
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
