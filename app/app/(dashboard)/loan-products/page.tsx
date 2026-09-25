"use client"

import { useState, useEffect } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { LoanProduct } from "@/lib/types"
import { Search, Plus, X, Box, MoreHorizontal, Edit, Trash2 } from "lucide-react"

interface ExtendedLoanProduct extends LoanProduct {
  interestType?: "FLAT" | "REDUCING"; rate?: number; docFee?: number; insuranceFee?: number; penaltyRate?: number;
}

function AddProductDrawer({ open, onClose, onSuccess, editProduct }: any) {
  const [form, setForm] = useState({ name: "", loanType: "QUICK" as any, numberOfWeeks: 13, interestType: "FLAT" as any, rate: 0, docFee: 0, insuranceFee: 0, penaltyRate: 0 })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  
  useEffect(() => {
    if (open) {
      if (editProduct) {
        setForm({ name: editProduct.name, loanType: editProduct.loanType, numberOfWeeks: editProduct.numberOfWeeks, interestType: editProduct.interestType || "FLAT", rate: editProduct.rate || 0, docFee: editProduct.docFee || 0, insuranceFee: editProduct.insuranceFee || 0, penaltyRate: editProduct.penaltyRate || 0 })
      } else {
        setForm({ name: "", loanType: "QUICK", numberOfWeeks: 13, interestType: "FLAT", rate: 0, docFee: 0, insuranceFee: 0, penaltyRate: 0 })
      }
      setError("")
    }
  }, [open, editProduct])

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    try {
      setSubmitting(true); setError("")
      const payload = { ...form, multiplier: 1.17, calculationMethod: "FLAT", interestMethod: "FLAT", repaymentFrequency: "WEEKLY", isActive: true }
      const res = await fetch(editProduct ? `/api/loan-products/${editProduct.id}` : '/api/loan-products', {
        method: editProduct ? 'PUT' : 'POST',
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || "Failed to save product") }
      onSuccess(); onClose()
    } catch (err: any) { setError(err.message) }
    finally { setSubmitting(false) }
  }

  const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-[14px] text-navy-900 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all"

  return (
    <>
      <div className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`} onClick={onClose} />
      <aside className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div><h2 className="text-[17px] font-semibold text-navy-900">{editProduct ? 'Edit Product' : 'Create Product'}</h2><p className="text-[13px] text-slate-500 mt-0.5">Configure lending terms</p></div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {error && <div className="text-[13px] text-danger-600 bg-danger-50 rounded-lg px-4 py-3 border border-danger-100">{error}</div>}
          
          <div className="flex flex-col gap-1.5">
            <label className="text-[13px] font-medium text-slate-700">Product Name <span className="text-danger-500">*</span></label>
            <input required placeholder="E.g. Quick 13W" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-slate-700">Category</label>
              <select value={form.loanType} onChange={e => setForm({...form, loanType: e.target.value})} className={inputCls}>
                <option value="QUICK">QUICK</option><option value="BUSINESS">BUSINESS</option><option value="MICRO">MICRO</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-slate-700">Weeks <span className="text-danger-500">*</span></label>
              <input required type="number" min="1" value={form.numberOfWeeks} onChange={e => setForm({...form, numberOfWeeks: parseInt(e.target.value)||0})} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-slate-700">Interest Type</label>
              <select value={form.interestType} onChange={e => setForm({...form, interestType: e.target.value})} className={inputCls}>
                <option value="FLAT">FLAT</option><option value="REDUCING">REDUCING</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-slate-700">Rate (%) <span className="text-danger-500">*</span></label>
              <input required type="number" step="0.1" value={form.rate} onChange={e => setForm({...form, rate: parseFloat(e.target.value)||0})} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-gray-100 pt-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-slate-700">Doc Fee</label>
              <input type="number" value={form.docFee} onChange={e => setForm({...form, docFee: parseFloat(e.target.value)||0})} className={inputCls} />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-medium text-slate-700">Insurance Fee</label>
              <input type="number" value={form.insuranceFee} onChange={e => setForm({...form, insuranceFee: parseFloat(e.target.value)||0})} className={inputCls} />
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-gray-100 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-lg border border-gray-200 text-[14px] font-medium text-slate-600 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={submitting} className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-[14px] font-medium hover:bg-brand-700 transition-colors disabled:opacity-60">{submitting ? "Saving..." : (editProduct ? "Update" : "Create")}</button>
          </div>
        </form>
      </aside>
    </>
  )
}

export default function LoanProductsPage() {
  const [products, setProducts] = useState<ExtendedLoanProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ExtendedLoanProduct | null>(null)
  const [search, setSearch] = useState("")

  const fetchProducts = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/loan-products')
      if (res.ok) setProducts(await res.json())
    } finally { setIsLoading(false) }
  }
  useEffect(() => { fetchProducts() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure?")) return
    try {
      const res = await fetch(`/api/loan-products/${id}`, { method: 'DELETE' })
      if (res.ok) window.location.reload()
    } catch (err) {}
  }

  const filtered = products.filter(p => {
    const q = search.toLowerCase()
    return !q || p.name.toLowerCase().includes(q) || p.loanType.toLowerCase().includes(q)
  })

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-navy-900 tracking-tight">Loan Products</h1>
          <p className="text-[14px] text-slate-500 mt-0.5">{isLoading ? "Loading..." : `${products.length} products configured`}</p>
        </div>
        <button onClick={() => { setEditingProduct(null); setDrawerOpen(true); }} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-[14px] font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors">
          <Plus className="w-4 h-4" /> Create Product
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1 max-w-[480px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 text-[14px] bg-white border border-gray-200 rounded-lg text-navy-900 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all" />
        </div>
      </div>

      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left py-3 px-5 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Product</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Category</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Terms</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Fees</th>
                <th className="text-right py-3 px-5 text-[12px] font-semibold text-slate-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400">Loading products...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center text-slate-400">No products found</td></tr>
              ) : filtered.map(p => (
                <tr key={p.id} className="hover:bg-gray-50/70 transition-colors group">
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center flex-shrink-0 text-orange-700`}>
                        <Box className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-[14px] font-semibold text-navy-900">{p.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4"><span className="text-[12px] font-medium text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">{p.loanType}</span></td>
                  <td className="py-3.5 px-4 text-[13px] text-slate-600">
                    <div className="font-medium text-navy-900">{p.numberOfWeeks}W</div>
                    <div className="text-[12px] mt-0.5 text-slate-500">{p.rate || 0}% {p.interestType || "FLAT"}</div>
                  </td>
                  <td className="py-3.5 px-4 text-[13px] text-slate-600">
                    <div>Doc: LKR {p.docFee || 0}</div>
                    <div className="text-[12px] mt-0.5 text-slate-500">Ins: LKR {p.insuranceFee || 0}</div>
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingProduct(p); setDrawerOpen(true); }} className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-colors"><Edit className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(p.id)} className="p-1.5 text-slate-400 hover:text-danger-600 hover:bg-danger-50 rounded-md transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <AddProductDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} editProduct={editingProduct} onSuccess={() => {}} />
    </div>
  )
}
