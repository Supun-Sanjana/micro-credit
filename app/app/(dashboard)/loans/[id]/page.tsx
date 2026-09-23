"use client"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { format } from "date-fns"
import Link from "next/link"
import { 
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"

export default function LoanDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [loan, setLoan] = useState<any>()
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const [openDialog, setOpenDialog] = useState<string | null>(null)

  const load = async () => { 
    const r = await fetch(`/api/loans/${id}`)
    setLoan(await r.json()) 
  }
  
  useEffect(() => { load() }, [id])

  const submit = async (action: string, payload: any) => {
    setBusy(true)
    const r = await fetch(`/api/loans/${id}/events`, { 
      method: "POST", 
      headers: { "Content-Type": "application/json" }, 
      body: JSON.stringify({ action, ...payload }) 
    })
    const body = await r.json()
    setNotice(r.ok ? `${action.replace("_", " ")} recorded.` : body.error || "Action failed")
    setBusy(false)
    if (r.ok) {
      setOpenDialog(null)
      load()
    }
  }

  if (!loan || loan.error) {
    return <p className="p-8 text-slate-gray">{loan?.error || "Loading loan…"}</p>
  }
  
  const totalWrittenOff = loan.repayments?.filter((r: any) => r.transactionType === "WRITE_OFF").reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0) || 0
  const totalRecovered = loan.repayments?.filter((r: any) => r.transactionType === "RECOVERY").reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0) || 0

  const totalReceivable = Number(loan.totalReceivable || 0)
  const loanAmount = Number(loan.loanAmount || 0)
  const interestPortion = totalReceivable - loanAmount

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif">Loan {loan.loanNumber || "Details"}</h1>
          <p className="text-slate-gray">{loan.member?.name} · {loan.member?.memberNumber}</p>
        </div>
        <span className="rounded-full bg-mist-gray px-4 py-2 text-sm">{loan.status}</span>
      </header>

      {notice && <p className="rounded-lg bg-mist-gray p-3">{notice}</p>}

      <div className="grid gap-4 md:grid-cols-3">
        {[
          ["Principal", loan.loanAmount],
          ["Outstanding", loan.outstanding],
          ["Total paid", loan.totalPaid]
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border p-5">
            <p className="text-sm text-slate-gray">{label}</p>
            <b className="text-xl">LKR {Number(value || 0).toLocaleString()}</b>
          </div>
        ))}
      </div>

      {loan.member?.creditAssessments?.[0] && (
        <section className="rounded-2xl border p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium">Credit Assessment</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              loan.member.creditAssessments[0].grade === 'A' ? 'bg-green-100 text-green-800' :
              loan.member.creditAssessments[0].grade === 'B' ? 'bg-blue-100 text-blue-800' :
              loan.member.creditAssessments[0].grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              Grade {loan.member.creditAssessments[0].grade} · {loan.member.creditAssessments[0].score}/100
            </span>
          </div>
          <ul className="space-y-2 text-sm text-slate-gray">
            {loan.member.creditAssessments[0].factors.map((f: string, i: number) => (
              <li key={i} className="flex gap-2">
                <span className={f.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                  {f.startsWith('+') ? '+' : '-'}
                </span>
                <span>{f.substring(1).trim()}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="rounded-2xl bg-mist-gray p-5">
        <h2 className="font-medium">Financial events</h2>
        <p className="mb-4 mt-1 text-sm text-slate-gray">These preserve the original loan and payment history.</p>
        <div className="flex flex-wrap gap-3">
          
          <Dialog open={openDialog === 'TOP_UP'} onOpenChange={(o) => setOpenDialog(o ? 'TOP_UP' : null)}>
            <DialogTrigger disabled={busy} className="rounded-full border bg-paper-white px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition-colors">
              Top-up / Refinance
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Top-up / Refinance Loan</DialogTitle>
                <DialogDescription>Provide new loan amount and reason.</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                submit("TOP_UP", { 
                  newLoanAmount: fd.get("amount"), 
                  reason: fd.get("reason") || "Top-up" 
                })
              }} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-gray mb-1">New Loan Amount</label>
                  <input required type="number" name="amount" min={Number(loan.outstanding) + 1} step="0.01" className="w-full bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px]" placeholder={`Must exceed ${loan.outstanding}`} />
                </div>
                <div>
                  <label className="block text-sm text-slate-gray mb-1">Reason</label>
                  <textarea name="reason" className="w-full bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] min-h-[100px]" placeholder="Reason for top-up"></textarea>
                </div>
                <DialogFooter>
                  <button type="submit" disabled={busy} className="bg-ink-black text-paper-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-ink-black/90 transition-colors">
                    Confirm Top-up
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={openDialog === 'WRITE_OFF'} onOpenChange={(o) => setOpenDialog(o ? 'WRITE_OFF' : null)}>
            <DialogTrigger disabled={busy} className="rounded-full border bg-paper-white px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition-colors">
              Write off
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Write off Loan</DialogTitle>
                <DialogDescription>This will write off the remaining outstanding balance.</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                submit("WRITE_OFF", { reason: fd.get("reason") })
              }} className="space-y-4">
                <div className="bg-[#f8f8f8] rounded-[16px] p-4 text-sm border border-[#ececec]">
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-gray">Total Receivable:</span>
                    <span className="font-medium">LKR {totalReceivable.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-slate-gray">Principal:</span>
                    <span className="font-medium">LKR {loanAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-[#ececec]">
                    <span className="text-slate-gray">Interest Portion:</span>
                    <span className="font-medium">LKR {interestPortion.toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-gray mb-1">Write-off Reason <span className="text-sienna-brown">*</span></label>
                  <textarea required name="reason" className="w-full bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] min-h-[100px]" placeholder="Enter reason for write-off..."></textarea>
                </div>
                <DialogFooter>
                  <button type="submit" disabled={busy} className="bg-sienna-brown text-paper-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-sienna-brown/90 transition-colors">
                    Confirm Write-off
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={openDialog === 'RECOVERY'} onOpenChange={(o) => setOpenDialog(o ? 'RECOVERY' : null)}>
            <DialogTrigger disabled={busy} className="rounded-full border bg-paper-white px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-slate-50 transition-colors">
              Record recovery
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Recovery</DialogTitle>
                <DialogDescription>Record a recovery payment for a written-off loan.</DialogDescription>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                submit("RECOVERY", { 
                  amount: fd.get("amount"),
                  date: fd.get("date"),
                  note: fd.get("note")
                })
              }} className="space-y-4">
                <div className="bg-[#f8f8f8] rounded-[16px] p-4 text-sm flex gap-4 border border-[#ececec]">
                  <div className="flex-1">
                    <span className="text-slate-gray block text-xs mb-1">Total Written Off</span>
                    <span className="font-medium">LKR {totalWrittenOff.toLocaleString()}</span>
                  </div>
                  <div className="flex-1">
                    <span className="text-slate-gray block text-xs mb-1">Total Recovered</span>
                    <span className="font-medium text-[#059669]">LKR {totalRecovered.toLocaleString()}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-gray mb-1">Amount <span className="text-sienna-brown">*</span></label>
                  <input required type="number" name="amount" min="0.01" step="0.01" className="w-full bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px]" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm text-slate-gray mb-1">Date</label>
                  <input required type="date" name="date" defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px]" />
                </div>
                <div>
                  <label className="block text-sm text-slate-gray mb-1">Note (optional)</label>
                  <textarea name="note" className="w-full bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] min-h-[80px]" placeholder="Additional details..."></textarea>
                </div>
                <DialogFooter>
                  <button type="submit" disabled={busy} className="bg-ink-black text-paper-white rounded-full px-6 py-2.5 text-sm font-medium hover:bg-ink-black/90 transition-colors">
                    Save Recovery
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

        </div>
        
        <div className="mt-6 pt-5 border-t border-[#ececec]">
          <p className="mb-3 text-sm text-slate-gray">Restructuring requires a reviewed replacement schedule.</p>
          <Link href={`/app/loans/${id}/restructure`} className="inline-flex items-center justify-center rounded-full border border-[#ececec] bg-paper-white text-ink-black px-6 py-2.5 text-sm font-medium hover:bg-[#fafafa] transition-colors shadow-subtle-1">
            Restructure Loan
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border p-5">
        <h2 className="mb-3 font-medium">Repayment history</h2>
        <div className="divide-y border-t mt-3">
          {loan.repayments?.map((r: any) => (
            <div className="flex justify-between py-3 text-sm" key={r.id}>
              <span className="text-slate-gray">{format(new Date(r.paidDate), "PP")} · {r.transactionType} {r.method ? `· ${r.method}` : ''}</span>
              <b className="text-ink-black">LKR {Number(r.amount).toLocaleString()}</b>
            </div>
          ))}
          {(!loan.repayments || loan.repayments.length === 0) && (
            <p className="py-4 text-slate-gray text-sm">No repayments recorded.</p>
          )}
        </div>
      </section>
    </div>
  )
}
