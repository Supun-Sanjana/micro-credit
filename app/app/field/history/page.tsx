"use client"

import { useEffect, useState } from "react"
import { Loader2, Calendar, AlertCircle, CheckCircle2 } from "lucide-react"

export default function HistoryPage() {
  const [history, setHistory] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await fetch("/api/field/history")
        if (res.ok) {
          setHistory(await res.json())
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchHistory()
  }, [])

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-gray" /></div>

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 pb-24">
      <div className="flex flex-col gap-1 pt-2">
        <h1 className="text-[28px] leading-[1.3] text-ink-black font-serif font-normal" style={{ letterSpacing: '-0.66px' }}>
          Collection History
        </h1>
        <p className="text-[15px] text-slate-gray">
          Your recent field attempts and payments.
        </p>
      </div>

      {history.length === 0 ? (
        <div className="bg-paper-white rounded-2xl border border-[#ececec] p-8 text-center text-slate-gray shadow-subtle-1 text-sm">
          No history found.
        </div>
      ) : (
        <div className="space-y-4">
          {history.map((item) => {
            const isMissed = item.outcome === 'MISSED'
            const member = item.schedule?.loan?.member
            
            return (
              <div key={item.id} className="bg-paper-white rounded-2xl border border-[#ececec] p-5 shadow-subtle-1 flex flex-col gap-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[15px] font-medium text-ink-black">
                      {member ? `${member.firstName} ${member.lastName}` : 'Unknown Member'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[12px] text-slate-gray mt-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(item.attemptedAt).toLocaleString()}</span>
                    </div>
                  </div>
                  
                  {isMissed ? (
                    <span className="flex items-center gap-1 bg-[#fce8e6] text-[#c5221f] px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide">
                      <AlertCircle className="w-3 h-3" /> Missed
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 bg-[#e6f4ea] text-[#137333] px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide">
                      <CheckCircle2 className="w-3 h-3" /> {item.outcome}
                    </span>
                  )}
                </div>

                {isMissed && item.reason && (
                  <div className="text-[13px] text-slate-gray bg-mist-gray/50 px-3 py-2 rounded-lg">
                    <span className="font-medium text-ink-black mr-2">Reason:</span> 
                    {item.reason.replace(/_/g, ' ')}
                    {item.notes && <span className="block mt-1 italic opacity-80">{item.notes}</span>}
                  </div>
                )}
                
                {!isMissed && item.amountCollected && (
                  <div className="text-[14px] font-medium text-ink-black">
                    Collected: LKR {Number(item.amountCollected).toLocaleString()}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
