"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, MapPin, ChevronRight, Users } from "lucide-react"

export default function CentresListPage() {
  const [centres, setCentres] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchCentres = async () => {
      try {
        const res = await fetch("/api/field/centres")
        if (!res.ok) throw new Error("Failed to fetch centres")
        const json = await res.json()
        setCentres(json)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchCentres()
  }, [])

  if (loading) return <div className="p-8 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-gray" /></div>

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 pb-24">
      <div className="flex flex-col gap-1 pt-2">
        <h1 className="text-[28px] leading-[1.3] text-ink-black font-serif font-normal" style={{ letterSpacing: '-0.66px' }}>
          My Centres
        </h1>
        <p className="text-[15px] text-slate-gray">
          Select a centre to view today's collection sheet.
        </p>
      </div>

      {error && (
        <div className="bg-[#fce8e6] text-[#c5221f] p-4 rounded-xl text-[14px] font-medium border border-[#f9d2ce]">
          {error}
        </div>
      )}

      {centres.length === 0 && !error ? (
        <div className="bg-paper-white rounded-2xl border border-[#ececec] p-8 text-center text-slate-gray shadow-subtle-1 text-sm">
          You are not currently assigned to any active centres.
        </div>
      ) : (
        <div className="space-y-4">
          {centres.map((centre) => (
            <Link 
              key={centre.id} 
              href={`/app/field/centres/${centre.id}`}
              className="flex items-center justify-between bg-paper-white rounded-2xl border border-[#ececec] p-5 shadow-subtle-1 active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-mist-gray flex items-center justify-center text-ink-black">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-[16px] font-medium text-ink-black">{centre.name}</h3>
                  <div className="flex items-center gap-1.5 text-[13px] text-slate-gray mt-1">
                    <Users className="w-3.5 h-3.5" /> 
                    <span>Assigned Collection</span>
                  </div>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-gray" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
