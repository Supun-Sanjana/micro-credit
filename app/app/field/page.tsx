"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, ArrowRight, ShieldCheck, Clock, Wallet } from "lucide-react"

export default function FieldDashboard() {
  const [data, setData] = useState<{ expectedAmount: number, collectedAmount: number, progress: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch("/api/field/dashboard")
        if (res.ok) {
          setData(await res.json())
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboard()
  }, [])

  if (loading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-500" /></div>
  }

  const progress = data?.progress || 0
  const expected = data?.expectedAmount || 0
  const collected = data?.collectedAmount || 0

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 pb-24">
      <div className="flex flex-col gap-1 pt-2">
        <h1 className="text-[28px] leading-[1.3] text-navy-900 font-serif font-normal" style={{ letterSpacing: '-0.66px' }}>
          Today's Overview
        </h1>
        <p className="text-[15px] text-slate-500">
          Track your daily collections and field progress.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-[#ececec] p-6 shadow-subtle-1 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-50">
          <div 
            className="h-full bg-navy-900 transition-all duration-1000 ease-out" 
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="mt-2 mb-6">
          <div className="text-[13px] font-medium text-slate-500 mb-1 uppercase tracking-wide">Collection Target</div>
          <div className="flex items-baseline gap-2">
            <span className="text-[32px] font-serif text-navy-900 leading-none">LKR {collected.toLocaleString()}</span>
            <span className="text-[16px] text-slate-500">/ {expected.toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50/40 rounded-2xl p-4 border border-[#ececec]">
            <div className="w-8 h-8 rounded-full bg-[#e6f4ea] text-[#137333] flex items-center justify-center mb-3">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-[13px] text-slate-500 mb-0.5">Collected</div>
            <div className="text-[16px] font-medium text-navy-900">LKR {collected.toLocaleString()}</div>
          </div>
          <div className="bg-slate-50/40 rounded-2xl p-4 border border-[#ececec]">
            <div className="w-8 h-8 rounded-full bg-[#fce8e6] text-[#c5221f] flex items-center justify-center mb-3">
              <Clock className="w-4 h-4" />
            </div>
            <div className="text-[13px] text-slate-500 mb-0.5">Remaining</div>
            <div className="text-[16px] font-medium text-navy-900">LKR {Math.max(0, expected - collected).toLocaleString()}</div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Link 
          href="/app/field/centres"
          className="flex items-center justify-between bg-white rounded-2xl border border-[#ececec] p-5 shadow-subtle-1 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-500">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-medium text-navy-900">Start Collection</h3>
              <p className="text-[13px] text-slate-500">Visit your assigned centres</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-slate-500" />
        </Link>
        
        <Link 
          href="/app/field/reconcile"
          className="flex items-center justify-between bg-navy-900 text-white rounded-2xl p-5 shadow-subtle-1 active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[16px] font-medium">EOD Reconciliation</h3>
              <p className="text-[13px] text-white/70">Submit cash and bank totals</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-white/70" />
        </Link>
      </div>
    </div>
  )
}
