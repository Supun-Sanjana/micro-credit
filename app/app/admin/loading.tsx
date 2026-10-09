import { LogoTraceLoader } from "@/components/LogoTraceLoader"

export default function AdminLoading() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans">
      <LogoTraceLoader size={48} className="text-navy-900 mb-4" />
      <p className="text-[15px] text-slate-500 font-medium">Loading platform data...</p>
    </div>
  )
}
