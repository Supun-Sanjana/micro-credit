"use client"

import { useState } from "react"
import { mockCentres, mockBranches } from "@/lib/mock-data"
import { Centre } from "@/lib/types"

export default function CentresPage() {
  const [centres, setCentres] = useState<Centre[]>(mockCentres)
  const [formData, setFormData] = useState({ 
    branchId: "", 
    centreNumber: 1, 
    centreCode: "", 
    name: "", 
    isMicro: false 
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const newCentre: Centre = {
      id: `ctr_${Date.now()}`,
      branchId: formData.branchId,
      centreNumber: formData.centreNumber,
      centreCode: formData.centreCode,
      name: formData.name,
      isMicro: formData.isMicro,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    setCentres([...centres, newCentre])
    setFormData({ branchId: "", centreNumber: 1, centreCode: "", name: "", isMicro: false })
  }

  return (
    <div className="flex flex-col gap-[80px]">
      
      {/* Hero Section */}
      <div className="flex flex-col gap-4">
        <h1 
          className="text-[44px] leading-[1.3] text-ink-black font-serif font-normal"
          style={{ letterSpacing: '-0.66px' }}
        >
          Centres
        </h1>
        <p className="text-[17px] text-slate-gray max-w-[600px] leading-[1.35]">
          Manage and review local centres where groups of members operate.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[80px]">
        
        {/* Form (Floating Product Artifact) */}
        <div className="lg:col-span-4 h-fit">
          <div className="bg-paper-white rounded-[20px] shadow-subtle-3 p-[32px]">
            <h2 className="text-[20px] font-sans font-medium text-ink-black mb-6">
              New Centre
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-ink-black font-sans ml-1">Branch</label>
                <select 
                  required
                  value={formData.branchId}
                  onChange={e => setFormData({...formData, branchId: e.target.value})}
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black appearance-none"
                >
                  <option value="" disabled className="text-smoke-gray">Select Branch</option>
                  {mockBranches.map(b => (
                    <option key={b.id} value={b.id}>{b.name} ({b.code})</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-ink-black font-sans ml-1">Centre No.</label>
                <input 
                  required
                  type="number"
                  min="1"
                  value={formData.centreNumber}
                  onChange={e => setFormData({...formData, centreNumber: parseInt(e.target.value)||0})}
                  placeholder="e.g. 1"
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-ink-black font-sans ml-1">Code</label>
                <input 
                  required
                  value={formData.centreCode}
                  onChange={e => setFormData({...formData, centreCode: e.target.value})}
                  placeholder="e.g. SA01/001"
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-ink-black font-sans ml-1">Name</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Center North"
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black"
                />
              </div>

              <div className="flex items-center gap-3 pt-2 pb-2 pl-1 cursor-pointer">
                <div 
                  className={`w-5 h-5 flex items-center justify-center border rounded-[6px] transition-colors ${formData.isMicro ? 'bg-ink-black border-ink-black' : 'border-[#ececec] bg-transparent'}`}
                  onClick={() => setFormData({...formData, isMicro: !formData.isMicro})}
                >
                  {formData.isMicro && (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <label 
                  className="text-[15px] text-ink-black font-sans cursor-pointer select-none"
                  onClick={() => setFormData({...formData, isMicro: !formData.isMicro})}
                >
                  Is Micro Loan Centre
                </label>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full flex items-center justify-center bg-ink-black text-paper-white rounded-full px-[20px] py-[14px] text-[16px] font-sans transition-opacity hover:opacity-90"
                >
                  Create Centre
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
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Branch</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Code</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Name</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {centres.map(c => {
                    const branch = mockBranches.find(b => b.id === c.branchId)
                    return (
                      <tr key={c.id} className="border-b border-border/40 last:border-0">
                        <td className="py-5 pr-4 text-[16px] font-sans text-slate-gray">
                          {branch?.name || c.branchId}
                        </td>
                        <td className="py-5 pr-4 text-[16px] font-sans text-ink-black">
                          {c.centreCode}
                        </td>
                        <td className="py-5 pr-4 text-[16px] font-sans font-medium text-ink-black">
                          {c.name}
                        </td>
                        <td className="py-5 pr-4">
                          <span className="text-[14px] font-sans text-ash-gray uppercase tracking-wider">
                            {c.isMicro ? 'MICRO' : 'REGULAR'}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                  {centres.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-12 text-[15px] text-slate-gray">
                        No centres found.
                      </td>
                    </tr>
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
