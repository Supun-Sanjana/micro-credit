import { Loader2 } from "lucide-react"
import { LogoTraceLoader } from "@/components/LogoTraceLoader"

export default function LoginLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#ffffff] p-4 font-sans animate-in fade-in duration-150">
      {/* Floating Login Card Skeleton */}
      <div 
        className="w-full max-w-[440px] bg-[#ffffff] rounded-[20px] p-[40px] flex flex-col"
        style={{
          boxShadow: 'rgba(4, 23, 43, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.1) 0px 8px 10px -6px'
        }}
      >
        <div className="text-center mb-10 flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-medium mb-4">
            <LogoTraceLoader size={14} strokeWidth={6} className="text-brand-600" />
            <span>Loading workspace login...</span>
          </div>
          <div className="h-10 w-56 bg-slate-200 rounded-xl animate-pulse" />
          <div className="h-4 w-72 bg-slate-100 rounded-lg animate-pulse mt-3" />
        </div>

        <div className="flex flex-col space-y-[24px]">
          <div className="flex flex-col space-y-2">
            <div className="h-4 w-28 bg-slate-200 rounded animate-pulse ml-1" />
            <div className="h-[58px] bg-slate-50 border border-[#ececec] rounded-[16px] animate-pulse" />
          </div>

          <div className="flex flex-col space-y-2">
            <div className="h-4 w-20 bg-slate-200 rounded animate-pulse ml-1" />
            <div className="h-[58px] bg-slate-50 border border-[#ececec] rounded-[16px] animate-pulse" />
          </div>

          <div className="pt-4">
            <div className="w-full h-[54px] bg-slate-900/10 rounded-full flex items-center justify-center animate-pulse">
              <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center flex justify-center">
          <div className="h-4 w-48 bg-slate-100 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
