import { Loader2 } from "lucide-react"

export default function AppSegmentLoading() {
  return (
    <div className="min-h-screen bg-[#ffffff] flex flex-col items-center justify-center font-sans animate-in fade-in duration-150">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center border border-brand-100 shadow-sm">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
        <div className="text-center space-y-1">
          <p className="text-[16px] font-semibold text-navy-950">Opening Solida workspace...</p>
          <p className="text-[13px] text-slate-400">Loading your microfinance environment</p>
        </div>
      </div>
    </div>
  )
}
