"use client"

import { useState } from "react"
import { mockLoanProducts } from "@/lib/mock-data"
import { LoanProduct } from "@/lib/types"

// Extended type to support UI requirements before backend is updated
interface ExtendedLoanProduct extends LoanProduct {
  interestType?: "FLAT" | "REDUCING";
  rate?: number;
  docFee?: number;
  insuranceFee?: number;
  penaltyRate?: number;
}

export default function LoanProductsPage() {
  const [products, setProducts] = useState<ExtendedLoanProduct[]>(mockLoanProducts)
  
  const [isEditing, setIsEditing] = useState(false)
  const [currentId, setCurrentId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ 
    name: "", 
    loanType: "QUICK" as any, 
    numberOfWeeks: 13,
    interestType: "FLAT" as "FLAT" | "REDUCING",
    rate: 0,
    docFee: 0,
    insuranceFee: 0,
    penaltyRate: 0
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isEditing && currentId) {
      setProducts(products.map(p => p.id === currentId ? {
        ...p,
        ...formData
      } : p))
    } else {
      const newProduct: ExtendedLoanProduct = {
        id: `prod_${Date.now()}`,
        ...formData,
        organizationId: 'mock-org-id', // Just for UI mock
        multiplier: 1.17 as any, // Mock Decimal
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      setProducts([...products, newProduct])
    }
    resetForm()
  }

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure?")) return
    setProducts(products.filter(p => p.id !== id))
  }

  const handleEdit = (product: ExtendedLoanProduct) => {
    setIsEditing(true)
    setCurrentId(product.id)
    setFormData({
      name: product.name,
      loanType: product.loanType,
      numberOfWeeks: product.numberOfWeeks,
      interestType: product.interestType || "FLAT",
      rate: product.rate || 0,
      docFee: product.docFee || 0,
      insuranceFee: product.insuranceFee || 0,
      penaltyRate: product.penaltyRate || 0
    })
  }

  const resetForm = () => {
    setIsEditing(false)
    setCurrentId(null)
    setFormData({ 
      name: "", loanType: "QUICK", numberOfWeeks: 13,
      interestType: "FLAT", rate: 0, docFee: 0, insuranceFee: 0, penaltyRate: 0 
    })
  }

  return (
    <div className="flex flex-col gap-[80px]">
      
      {/* Hero Section */}
      <div className="flex flex-col gap-4">
        <h1 
          className="text-[44px] leading-[1.3] text-ink-black font-serif font-normal"
          style={{ letterSpacing: '-0.66px' }}
        >
          Loan Products
        </h1>
        <p className="text-[17px] text-slate-gray max-w-[600px] leading-[1.35]">
          Configure lending instruments, term duration, and interest schedules.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-[80px]">
        
        {/* Form (Floating Product Artifact) */}
        <div className="lg:col-span-4 h-fit">
          <div className="bg-paper-white rounded-[20px] shadow-subtle-3 p-[32px]">
            <h2 className="text-[20px] font-sans font-medium text-ink-black mb-6">
              {isEditing ? "Edit Product" : "New Product"}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              
              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-ink-black font-sans ml-1">Product Name</label>
                <input 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Quick 13W"
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-[15px] text-ink-black font-sans ml-1">Category</label>
                  <select 
                    value={formData.loanType}
                    onChange={e => setFormData({ ...formData, loanType: e.target.value as any })}
                    className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black appearance-none"
                  >
                    <option value="QUICK">QUICK</option>
                    <option value="BUSINESS">BUSINESS</option>
                    <option value="MICRO">MICRO</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[15px] text-ink-black font-sans ml-1">Weeks</label>
                  <input 
                    required
                    type="number"
                    min="1"
                    value={formData.numberOfWeeks}
                    onChange={e => setFormData({ ...formData, numberOfWeeks: parseInt(e.target.value) || 0 })}
                    className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-[#ececec] pt-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[15px] text-ink-black font-sans ml-1">Interest Type</label>
                  <select 
                    value={formData.interestType}
                    onChange={e => setFormData({ ...formData, interestType: e.target.value as any })}
                    className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black appearance-none"
                  >
                    <option value="FLAT">FLAT</option>
                    <option value="REDUCING">REDUCING</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[15px] text-ink-black font-sans ml-1">Rate (%)</label>
                  <input 
                    required
                    type="number"
                    step="0.1"
                    value={formData.rate}
                    onChange={e => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                    className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-[#ececec] pt-5">
                <label className="text-[14px] font-sans text-ash-gray uppercase tracking-wider ml-1">
                  Fees & Penalties
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[15px] text-ink-black font-sans ml-1">Doc Fee</label>
                    <input 
                      type="number"
                      value={formData.docFee}
                      onChange={e => setFormData({ ...formData, docFee: parseFloat(e.target.value) || 0 })}
                      className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[15px] text-ink-black font-sans ml-1">Insurance</label>
                    <input 
                      type="number"
                      value={formData.insuranceFee}
                      onChange={e => setFormData({ ...formData, insuranceFee: parseFloat(e.target.value) || 0 })}
                      className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="submit"
                  className="flex-1 flex items-center justify-center bg-ink-black text-paper-white rounded-full px-[20px] py-[14px] text-[16px] font-sans transition-opacity hover:opacity-90"
                >
                  {isEditing ? "Update" : "Create"}
                </button>
                {isEditing && (
                  <button 
                    type="button"
                    onClick={resetForm}
                    className="flex-1 flex items-center justify-center bg-transparent border border-ink-black text-ink-black rounded-full px-[20px] py-[14px] text-[16px] font-sans transition-opacity hover:opacity-70"
                  >
                    Cancel
                  </button>
                )}
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
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Name</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Category</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Terms</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Fees</th>
                    <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="border-b border-border/40 last:border-0">
                      <td className="py-5 pr-4 text-[16px] font-sans font-medium text-ink-black">
                        {product.name}
                      </td>
                      <td className="py-5 pr-4">
                         <span className="text-[14px] font-sans text-ash-gray uppercase tracking-wider">
                           {product.loanType}
                         </span>
                      </td>
                      <td className="py-5 pr-4 text-[15px] font-sans text-slate-gray">
                        <div className="text-ink-black">{product.numberOfWeeks}W</div>
                        <div className="text-[14px] mt-1">{product.rate || 0}% {product.interestType || "FLAT"}</div>
                      </td>
                      <td className="py-5 pr-4 text-[15px] font-sans text-slate-gray">
                        <div>Doc: {product.docFee || 0}</div>
                        <div className="mt-1">Ins: {product.insuranceFee || 0}</div>
                      </td>
                      <td className="py-5 pl-4 text-right">
                        <div className="flex items-center justify-end gap-4">
                          <button 
                            onClick={() => handleEdit(product)} 
                            className="text-[15px] text-ink-black hover:underline underline-offset-4"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(product.id)} 
                            className="text-[15px] text-sienna-brown hover:underline underline-offset-4"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-[15px] text-slate-gray">
                        No loan products configured.
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
