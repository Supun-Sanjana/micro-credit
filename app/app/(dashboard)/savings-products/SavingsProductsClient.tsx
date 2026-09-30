"use client"

import { useState, useEffect, useRef } from "react"
import { createSavingsProduct, updateSavingsProduct, deleteSavingsProduct } from "@/app/actions/savings"
import { SavingsType } from "@prisma/client"
import { Search, Plus, X, Pencil, Trash2 } from "lucide-react"
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

const inputCls = "w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 text-[14px] text-navy-900 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:bg-white focus:ring-2 focus:ring-brand-500/10 transition-all"

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[13px] font-medium text-slate-700">
        {label}{required && <span className="text-danger-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

function ProductDrawer({
  open, onClose, product, onSuccess
}: {
  open: boolean
  onClose: () => void
  product: Product | null
  onSuccess: () => void
}) {
  const [form, setForm] = useState({ name: "", code: "", type: "VOLUNTARY" as SavingsType, interestRate: 0, minimumBalance: 0, isActive: true })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      if (product) {
        setForm({
          name: product.name,
          code: product.code,
          type: product.type,
          interestRate: Number(product.interestRate),
          minimumBalance: Number(product.minimumBalance),
          isActive: product.isActive
        })
      } else {
        setForm({ name: "", code: "", type: "VOLUNTARY", interestRate: 0, minimumBalance: 0, isActive: true })
      }
      setError("")
      setTimeout(() => nameRef.current?.focus(), 120)
    }
  }, [open, product])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setSubmitting(true)
      setError("")
      
      const payload = { ...form }
      
      let res
      if (product) {
        res = await updateSavingsProduct(product.id, payload)
      } else {
        res = await createSavingsProduct(payload)
      }

      if (res.error) {
        throw new Error(res.error)
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px] transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <aside
        className={`fixed top-0 right-0 z-50 h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${open ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-[17px] font-semibold text-navy-900">{product ? "Edit" : "New"} Savings Product</h2>
            <p className="text-[13px] text-slate-500 mt-0.5">Configure product parameters</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">
          {error && (
            <div className="text-[13px] text-danger-600 bg-danger-50 rounded-lg px-4 py-3 border border-danger-100">
              {error}
            </div>
          )}

          <Field label="Product Name" required>
            <input
              ref={nameRef}
              required
              placeholder="E.g. Regular Savings"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={inputCls}
            />
          </Field>

          <Field label="Code" required>
            <input
              required
              placeholder="E.g. SAV-REG"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              className={inputCls}
            />
          </Field>

          <Field label="Type" required>
            <select
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as SavingsType })}
              className={inputCls}
            >
              <option value="VOLUNTARY">Voluntary</option>
              <option value="COMPULSORY">Compulsory</option>
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Interest Rate (%)" required>
              <input
                required
                type="number"
                step="0.01"
                min="0"
                value={form.interestRate}
                onChange={(e) => setForm({ ...form, interestRate: parseFloat(e.target.value) || 0 })}
                className={inputCls}
              />
            </Field>
            <Field label="Min. Balance" required>
              <input
                required
                type="number"
                min="0"
                value={form.minimumBalance}
                onChange={(e) => setForm({ ...form, minimumBalance: parseFloat(e.target.value) || 0 })}
                className={inputCls}
              />
            </Field>
          </div>

          {product && (
            <Field label="Status">
              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input 
                  type="checkbox" 
                  checked={form.isActive} 
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4 text-brand-600 rounded border-gray-300 focus:ring-brand-500"
                />
                <span className="text-[14px] text-slate-700">Active</span>
              </label>
            </Field>
          )}

          <div className="mt-auto pt-4 border-t border-gray-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-gray-200 text-[14px] font-medium text-slate-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg bg-brand-600 text-white text-[14px] font-medium hover:bg-brand-700 transition-colors disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </aside>
    </>
  )
}

export default function SavingsProductsClient({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [search, setSearch] = useState("")

  const filtered = initialProducts.filter(p => {
    const q = search.toLowerCase()
    return !q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)
  })

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this product?")) return
    const res = await deleteSavingsProduct(id)
    if (res.error) alert(res.error)
    else router.refresh()
  }

  return (
    <div className="flex flex-col h-full">
      {/* -- Page Header -- */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-[26px] font-bold text-navy-900 tracking-tight">Savings Products</h1>
          <p className="text-[14px] text-slate-500 mt-0.5">
            {initialProducts.length} product{initialProducts.length !== 1 ? "s" : ""} configured
          </p>
        </div>
        <button
          onClick={() => { setEditingProduct(null); setDrawerOpen(true); }}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white text-[14px] font-medium px-4 py-2.5 rounded-lg shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Product
        </button>
      </div>

      {/* -- Search -- */}
      <div className="flex mb-5">
        <div className="relative w-full sm:w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-[14px] bg-white border border-gray-200 rounded-lg text-navy-900 placeholder:text-slate-400 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/10 transition-all"
          />
        </div>
      </div>

      {/* -- Table -- */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/80">
                <th className="text-left py-3 px-5 text-[12px] font-semibold text-slate-500 uppercase tracking-wider w-[260px]">Product Name & Code</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Interest Rate</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Min. Balance</th>
                <th className="text-left py-3 px-4 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right py-3 px-5 text-[12px] font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="inline-flex flex-col items-center gap-3 text-slate-400">
                      <div>
                        <p className="text-[15px] font-medium text-slate-600">No products found</p>
                        <p className="text-[13px] text-slate-400 mt-1">
                          {search ? "Try adjusting your filters" : "Create your first product to get started"}
                        </p>
                      </div>
                      {!search && (
                        <button
                          onClick={() => { setEditingProduct(null); setDrawerOpen(true); }}
                          className="mt-2 flex items-center gap-1.5 text-[13px] font-medium text-brand-600 hover:text-brand-700"
                        >
                          <Plus className="w-4 h-4" /> Add Product
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition-colors group">
                    <td className="py-3.5 px-5">
                      <div className="text-[14px] font-semibold text-navy-900">{p.name}</div>
                      <div className="text-[12px] text-slate-400 mt-0.5">{p.code}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[13px] font-medium text-slate-600">
                        {p.type === "VOLUNTARY" ? "Voluntary" : "Compulsory"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[14px] font-medium text-navy-900">{Number(p.interestRate)}%</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[14px] font-medium text-navy-900">
                        {Number(p.minimumBalance).toLocaleString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium bg-success-50 text-success-700 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-success-500" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-medium bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => { setEditingProduct(p); setDrawerOpen(true); }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-brand-50 text-slate-400 hover:text-brand-600 transition-colors"
                          title="Edit Product"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-danger-50 text-slate-400 hover:text-danger-600 transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ProductDrawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setEditingProduct(null); }}
        product={editingProduct}
        onSuccess={() => router.refresh()}
      />
    </div>
  )
}
