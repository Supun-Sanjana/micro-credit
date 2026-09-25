"use client"

import { useState, useEffect } from "react"
import { cacheCollectionSheet, getCachedCollectionSheet, saveRepaymentOffline } from "@/lib/indexed-db"
import { CheckCircle2, CloudOff, Loader2, ChevronDown, X } from "lucide-react"

export default function CollectionSheetPage({ params }: { params: Promise<{ id: string }> }) {
  const [centreId, setCentreId] = useState<string | null>(null)
  const [data, setData] = useState<any[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOffline, setIsOffline] = useState(false)
  const [success, setSuccess] = useState<Record<string, 'PAID' | 'MISSED'>>({})
  
  const [activeLoanId, setActiveLoanId] = useState<string | null>(null)
  const [drawerMode, setDrawerMode] = useState<'FULL' | 'PARTIAL' | 'MISSED' | null>(null)
  
  // Drawer state
  const [amountInput, setAmountInput] = useState("")
  const [missedReason, setMissedReason] = useState("NO_CASH")
  const [missedNotes, setMissedNotes] = useState("")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    params.then(p => setCentreId(p.id))
  }, [params])

  useEffect(() => {
    if (!centreId) return

    const loadData = async () => {
      try {
        const online = navigator.onLine
        setIsOffline(!online)

        if (online) {
          const res = await fetch(`/api/field/centres/${centreId}/collection-sheet`)
          if (!res.ok) throw new Error("Failed to fetch")
          const json = await res.json()
          setData(json)
          await cacheCollectionSheet(centreId, json)
        } else {
          const cached = await getCachedCollectionSheet(centreId)
          if (cached) setData(cached.data)
        }
      } catch (err) {
        setIsOffline(true)
        const cached = await getCachedCollectionSheet(centreId)
        if (cached) setData(cached.data)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [centreId])

  const activeLoanData = data?.flatMap(m => m.loans).find(l => l.id === activeLoanId)
  const activeSchedule = activeLoanData?.repaymentSchedule?.[0]
  const exactDueAmount = activeSchedule ? Number(activeSchedule.principalDue) + Number(activeSchedule.interestDue) : 0

  const openDrawer = (loanId: string, mode: 'FULL' | 'PARTIAL' | 'MISSED') => {
    setActiveLoanId(loanId)
    setDrawerMode(mode)
    if (mode === 'FULL') {
      const sch = data?.flatMap(m => m.loans).find(l => l.id === loanId)?.repaymentSchedule?.[0]
      if (sch) setAmountInput(String(Number(sch.principalDue) + Number(sch.interestDue)))
    } else {
      setAmountInput("")
    }
  }

  const closeDrawer = () => {
    setActiveLoanId(null)
    setDrawerMode(null)
    setAmountInput("")
    setMissedReason("NO_CASH")
    setMissedNotes("")
  }

  const handleSubmit = async () => {
    if (!activeLoanId || !activeSchedule) return
    const memberId = data?.find(m => m.loans.some((l: any) => l.id === activeLoanId))?.id
    
    setSubmitting(true)

    try {
      if (drawerMode === 'MISSED') {
        if (navigator.onLine) {
          const res = await fetch("/api/field/missed", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              scheduleId: activeSchedule.id,
              reason: missedReason,
              notes: missedNotes,
              clientTransactionId: crypto.randomUUID()
            })
          })
          if (!res.ok) throw new Error("Failed to log missed payment")
        } else {
          // In a full implementation, we'd queue missed payments offline too
          alert("Cannot log missed payments offline yet.")
          throw new Error("Offline")
        }
        setSuccess(prev => ({ ...prev, [activeLoanId]: 'MISSED' }))
      } else {
        const amount = Number(amountInput)
        if (navigator.onLine) {
          const res = await fetch("/api/field/collect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              loanId: activeLoanId,
              scheduleId: activeSchedule.id,
              amount, 
              method: 'CASH',
              clientTransactionId: crypto.randomUUID(),
              notes: drawerMode === 'PARTIAL' ? "Partial Payment" : "Full Payment" 
            })
          })
          if (!res.ok) throw new Error("Network response was not ok")
        } else {
          throw new Error("Offline")
        }
        setSuccess(prev => ({ ...prev, [activeLoanId]: 'PAID' }))
      }
    } catch (err: any) {
      if (err.message === "Offline" && drawerMode !== 'MISSED') {
        await saveRepaymentOffline({
          id: crypto.randomUUID(),
          loanId: activeLoanId,
          amount: Number(amountInput),
          centreId: centreId!,
          memberId
        })
        setSuccess(prev => ({ ...prev, [activeLoanId]: 'PAID' }))
      }
    } finally {
      setSubmitting(false)
      closeDrawer()
    }
  }

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>

  return (
    <div className="mx-auto space-y-6 p-4 pb-24">
      <div className="flex flex-col gap-1 pt-2">
        <div className="flex items-center justify-between">
          <h1 className="text-[24px] text-navy-900 font-serif font-normal" style={{ letterSpacing: '-0.66px' }}>
            Centre {centreId}
          </h1>
          {isOffline && (
            <span className="flex items-center gap-1.5 bg-[#fce8e6] text-[#c5221f] px-2.5 py-1 rounded-full text-[12px] font-medium">
              <CloudOff className="w-3.5 h-3.5" /> Offline
            </span>
          )}
        </div>
        <p className="text-[14px] text-slate-500">
          Today's scheduled collections.
        </p>
      </div>

      {!data || data.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#ececec] p-8 text-center text-slate-500 shadow-subtle-1 text-sm">
          No collections scheduled for today.
        </div>
      ) : (
        <div className="space-y-4">
          {data.map((member: any) => (
            <div key={member.id} className="bg-white rounded-2xl border border-[#ececec] p-4 shadow-subtle-1">
              <h3 className="text-[15px] font-medium text-navy-900 mb-3">{member.firstName} {member.lastName}</h3>
              
              <div className="space-y-3">
                {member.loans?.map((loan: any) => {
                  const schedule = loan.repaymentSchedule[0]
                  if (!schedule) return null

                  const outcome = success[loan.id]
                  const due = Number(schedule.principalDue) + Number(schedule.interestDue)

                  return (
                    <div key={loan.id} className="flex flex-col gap-3 p-3 bg-slate-50/40 rounded-xl border border-[#ececec]">
                      <div className="flex justify-between items-center">
                        <div className="text-[12px] text-slate-500">Due Amount</div>
                        <div className="text-[15px] font-medium text-navy-900">LKR {due}</div>
                      </div>
                      
                      {outcome ? (
                        <div className={`text-[13px] font-medium px-3 py-2 rounded-lg flex items-center justify-center gap-2 ${outcome === 'PAID' ? 'bg-[#e6f4ea] text-[#137333]' : 'bg-[#fce8e6] text-[#c5221f]'}`}>
                          <CheckCircle2 className="w-4 h-4" /> {outcome === 'PAID' ? 'Collected' : 'Marked Missed'}
                        </div>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          <button onClick={() => openDrawer(loan.id, 'FULL')} className="bg-navy-900 text-white py-2 rounded-lg text-[13px] font-medium active:scale-95 transition-transform">
                            Full
                          </button>
                          <button onClick={() => openDrawer(loan.id, 'PARTIAL')} className="bg-white border border-[#ececec] text-navy-900 py-2 rounded-lg text-[13px] font-medium active:scale-95 transition-transform">
                            Partial
                          </button>
                          <button onClick={() => openDrawer(loan.id, 'MISSED')} className="bg-[#fce8e6] text-[#c5221f] py-2 rounded-lg text-[13px] font-medium active:scale-95 transition-transform">
                            Missed
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Drawer */}
      {activeLoanId && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-navy-900/40 backdrop-blur-sm" onClick={closeDrawer} />
          <div className="relative bg-white rounded-t-3xl p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-200">
            <button onClick={closeDrawer} className="absolute right-4 top-4 p-2 bg-slate-50 rounded-full text-slate-500"><X className="w-5 h-5" /></button>
            
            <h2 className="text-[20px] font-serif mb-6 text-navy-900">
              {drawerMode === 'FULL' ? 'Confirm Full Payment' : drawerMode === 'PARTIAL' ? 'Record Partial Payment' : 'Log Missed Payment'}
            </h2>

            {drawerMode !== 'MISSED' ? (
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-medium text-slate-500 mb-1 block">Amount (LKR)</label>
                  <input 
                    type="number"
                    value={amountInput}
                    onChange={e => setAmountInput(e.target.value)}
                    className="w-full text-[24px] font-medium border-b-2 border-[#ececec] py-2 outline-none focus:border-navy-900 bg-transparent"
                    autoFocus
                  />
                </div>
                {drawerMode === 'FULL' && (
                  <p className="text-[13px] text-slate-500">Expected amount is LKR {exactDueAmount}.</p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-[13px] font-medium text-slate-500 mb-1 block">Reason</label>
                  <select 
                    value={missedReason}
                    onChange={e => setMissedReason(e.target.value)}
                    className="w-full bg-slate-50 border border-[#ececec] rounded-xl px-4 py-3 outline-none focus:border-navy-900 text-[14px]"
                  >
                    <option value="NO_CASH">No Cash</option>
                    <option value="MEMBER_UNAVAILABLE">Member Unavailable</option>
                    <option value="BUSINESS_CLOSED">Business Closed</option>
                    <option value="REFUSED">Refused to Pay</option>
                    <option value="TRAVELING">Traveling</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[13px] font-medium text-slate-500 mb-1 block">Notes (Optional)</label>
                  <input 
                    type="text"
                    value={missedNotes}
                    onChange={e => setMissedNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-[#ececec] rounded-xl px-4 py-3 outline-none focus:border-navy-900 text-[14px]"
                    placeholder="Enter details..."
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={submitting || (drawerMode !== 'MISSED' && !amountInput)}
              className="w-full mt-8 bg-navy-900 text-white py-4 rounded-xl text-[15px] font-medium disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
              {drawerMode === 'MISSED' ? 'Save Missed Payment' : 'Confirm Collection'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
