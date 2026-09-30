"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import type { PlanConfig } from "@/lib/plans"

interface InvoiceModalProps {
  open: boolean
  onClose: () => void
  plan: PlanConfig | null
  orgName?: string
  onInvoiceGenerated?: (invoiceRef: string) => void
}

function generateRandomChars(length: number) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function InvoiceModal({ open, onClose, plan, orgName, onInvoiceGenerated }: InvoiceModalProps) {
  const [invoiceNumber, setInvoiceNumber] = useState("")

  useEffect(() => {
    if (open && plan) {
      const today = new Date()
      const yyyymmdd = today.toISOString().split("T")[0].replace(/-/g, "")
      const planName = plan.name.toUpperCase().replace(/\s+/g, "")
      const randomChars = generateRandomChars(5)
      const num = `INV-${yyyymmdd}-${planName}-${randomChars}`
      setInvoiceNumber(num)
      onInvoiceGenerated?.(num)
    }
  }, [open, plan]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!open || !plan) return null

  const todayDate = new Date()
  const dueDate = new Date(todayDate.getTime() + 7 * 24 * 60 * 60 * 1000)

  const fmt = (d: Date) =>
    d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })

  return (
    <>
      {/* Print-only styles */}
      <style>{`
        @media print {
          body > *:not(#invoice-root) { display: none !important; }
          #invoice-root { display: block !important; position: static !important; }
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Backdrop */}
      <div
        className="no-print fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        id="invoice-root"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto max-h-[92vh] rounded-2xl bg-white shadow-2xl print:shadow-none print:rounded-none print:max-h-none print:overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Invoice content */}
        <div className="p-10 text-sm text-black">
          {/* Header */}
          <div className="flex justify-between items-start mb-8 pb-8 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 bg-brand-50 rounded-lg flex items-center justify-center border border-brand-100">
                  <div className="w-4 h-4 border-2 border-brand-600 rounded-sm transform rotate-45" />
                </div>
                <span className="text-[17px] font-bold text-navy-950 tracking-tight">MicroCredit Platform Ltd</span>
              </div>
              <p className="text-[22px] font-bold text-navy-950 tracking-tight">PROFORMA INVOICE</p>
              <p className="text-slate-500 text-[13px] mt-1">Payment required within 7 days</p>
            </div>
            <div className="text-right">
              <div className="font-mono font-bold text-[15px] text-navy-950 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">{invoiceNumber}</div>
              <div className="mt-2 text-[13px] text-slate-500">Issue Date: <span className="text-navy-900 font-medium">{fmt(todayDate)}</span></div>
              <div className="text-[13px] text-slate-500">Due Date: <span className="text-danger-600 font-semibold">{fmt(dueDate)}</span></div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bill To</h3>
            <div className="text-[16px] font-semibold text-navy-950">{orgName || "Your Organization"}</div>
          </div>

          {/* Line Items */}
          <table className="w-full mb-8 text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200">
                <th className="pb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">Description</th>
                <th className="pb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500">Period</th>
                <th className="pb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500 text-right">Unit Price</th>
                <th className="pb-3 text-[11px] font-bold uppercase tracking-widest text-slate-500 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-4">
                  <div className="font-semibold text-navy-950">{plan.name} Plan Subscription</div>
                  <div className="text-[12px] text-slate-500 mt-0.5">{plan.maxOfficerSeats} seats · {plan.maxBranches} {plan.maxBranches === 1 ? "branch" : "branches"} · {plan.storageDisplay} storage</div>
                </td>
                <td className="py-4 text-slate-600">1 Month</td>
                <td className="py-4 text-right text-slate-700">LKR {plan.monthlyPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                <td className="py-4 text-right font-semibold text-navy-950">LKR {plan.monthlyPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="pt-3 text-right text-slate-500 text-[13px]">Subtotal</td>
                <td className="pt-3 text-right text-navy-900">LKR {plan.monthlyPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
              <tr>
                <td colSpan={3} className="py-1 text-right text-slate-400 text-[13px]">Tax (0% — Exempt)</td>
                <td className="py-1 text-right text-slate-400 text-[13px]">LKR 0.00</td>
              </tr>
              <tr className="border-t-2 border-slate-200">
                <td colSpan={3} className="pt-3 text-right text-[15px] font-bold text-navy-950">Amount Due</td>
                <td className="pt-3 text-right text-[17px] font-bold text-navy-950">LKR {plan.monthlyPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>

          {/* Payment Instructions */}
          <div className="bg-[#fdfbf7] border border-[#d9cfc0] rounded-xl p-6 mb-4">
            <h3 className="font-bold text-navy-950 mb-4 text-[14px]">Payment Instructions — Bank Transfer</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-[13px]">
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Bank</span>
                <span className="font-medium text-navy-900">Bank of Ceylon (BOC)</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Account Name</span>
                <span className="font-medium text-navy-900">MicroCredit Platform Ltd</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Account Number</span>
                <span className="font-mono font-bold text-navy-950 text-[15px] tracking-widest">0084 1029 8452</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold">Branch & SWIFT</span>
                <span className="font-medium text-navy-900">Colombo Corporate (BOCELKJA)</span>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-[#d9cfc0]">
              <span className="text-slate-400 block text-[11px] uppercase tracking-wider font-semibold mb-1">Reference to use when transferring</span>
              <span className="font-mono font-bold text-[18px] text-navy-950 tracking-wider">{invoiceNumber}</span>
              <p className="mt-2 text-[12px] text-slate-500 leading-relaxed">
                ⚠️ Please include the Invoice Number exactly as shown above as the payment reference / narration when making your bank transfer. This is required to match your payment to this invoice.
              </p>
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div className="no-print sticky bottom-0 flex justify-end gap-3 px-10 py-4 bg-white border-t border-slate-100 rounded-b-2xl">
          <Button variant="outline" onClick={onClose}>
            ✕ Close
          </Button>
          <Button onClick={() => window.print()} className="bg-navy-900 text-white hover:bg-navy-800">
            🖨 Print / Save PDF
          </Button>
        </div>
      </div>
    </>
  )
}
