import { Loader2 } from "lucide-react"

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-mist-gray flex flex-col items-center justify-center font-sans">
      <Loader2 className="h-8 w-8 animate-spin text-ink-black mb-4" />
      <p className="text-[15px] text-slate-gray font-medium">Loading platform data...</p>
    </div>
  )
}
