"use client"

import { useState } from "react"
import { createSavingsProduct } from "@/app/actions/savings"
import { SavingsType } from "@prisma/client"
import { useRouter } from "next/navigation"

type Product = {
  id: string
  name: string
  code: string
  type: SavingsType
  interestRate: any
  minimumBalance: any
  isActive: boolean
}

export default function SavingsProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({ 
    name: "", 
    code: "", 
    type: "VOLUNTARY" as SavingsType, 
    interestRate: 0,
    minimumBalance: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setIsSubmitting(true)
      const res = await createSavingsProduct(formData)
      if (res.error) {
        alert(res.error)
      } else {
        setFormData({ name: "", code: "", type: "VOLUNTARY", interestRate: 0, minimumBalance: 0 })
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-[48px]">
      {/* Form Card */}
      <div className="lg:col-span-4 h-fit">
        <div className="bg-white rounded-[20px] shadow-subtle-3 p-[32px]">
          <h2 className="text-[20px] font-sans font-medium text-navy-900 mb-6">
            New Product
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <label className="text-[15px] text-navy-900 font-sans ml-1">Product Name</label>
              <input 
                required
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Regular Savings"
                className="bg-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-navy-900 placeholder:text-slate-300 outline-none focus:border-navy-900"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-[15px] text-navy-900 font-sans ml-1">Code</label>
              <input 
                required
                value={formData.code}
                onChange={e => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. SAV-REG"
                className="bg-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-navy-900 placeholder:text-slate-300 outline-none focus:border-navy-900"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[15px] text-navy-900 font-sans ml-1">Type</label>
              <select 
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as SavingsType })}
                className="bg-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-navy-900 outline-none focus:border-navy-900 appearance-none"
              >
                <option value="VOLUNTARY">VOLUNTARY</option>
                <option value="COMPULSORY">COMPULSORY</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-[#ececec] pt-5">
              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-navy-900 font-sans ml-1">Interest Rate (%)</label>
                <input 
                  required
                  type="number"
                  step="0.1"
                  value={formData.interestRate}
                  onChange={e => setFormData({ ...formData, interestRate: parseFloat(e.target.value) || 0 })}
                  className="bg-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-navy-900 outline-none focus:border-navy-900"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-navy-900 font-sans ml-1">Min. Balance</label>
                <input 
                  required
                  type="number"
                  value={formData.minimumBalance}
                  onChange={e => setFormData({ ...formData, minimumBalance: parseFloat(e.target.value) || 0 })}
                  className="bg-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-navy-900 outline-none focus:border-navy-900"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <button 
                type="submit"
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center bg-navy-900 text-white rounded-full px-[20px] py-[14px] text-[16px] font-sans transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Create"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* List Card */}
      <div className="lg:col-span-8">
        <div className="bg-slate-50 rounded-[24px] p-[32px] md:p-[40px]">
          <div className="w-full overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40">
                  <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Name & Code</th>
                  <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Type</th>
                  <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Interest</th>
                  <th className="pb-4 font-sans text-[15px] text-slate-500 font-normal">Min. Balance</th>
                </tr>
              </thead>
              <tbody>
                {initialProducts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-12 text-[15px] text-slate-500">
                      No savings products configured.
                    </td>
                  </tr>
                ) : (
                  initialProducts.map((product) => (
                    <tr key={product.id} className="border-b border-border/40 last:border-0">
                      <td className="py-5 pr-4">
                        <div className="text-[16px] font-sans font-medium text-navy-900">{product.name}</div>
                        <div className="text-[14px] mt-1 text-slate-500">{product.code}</div>
                      </td>
                      <td className="py-5 pr-4">
                          <span className="text-[14px] font-sans text-slate-400 uppercase tracking-wider">
                            {product.type}
                          </span>
                      </td>
                      <td className="py-5 pr-4 text-[15px] font-sans text-navy-900">
                        {Number(product.interestRate)}%
                      </td>
                      <td className="py-5 pr-4 text-[15px] font-sans text-navy-900">
                        {Number(product.minimumBalance).toLocaleString()}
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
  )
}
