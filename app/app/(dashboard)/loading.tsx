import { Loader2 } from "lucide-react"
import { LogoTraceLoader } from "@/components/LogoTraceLoader"

export default function DashboardLoading() {
  return (
    <div className="w-full h-full space-y-6 animate-in fade-in duration-150">
      {/* Page Header Skeleton with Live Loading Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/70">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-48 bg-slate-200 rounded-lg animate-pulse" />
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-50 border border-brand-100 text-brand-700 text-xs font-medium">
              <LogoTraceLoader size={14} strokeWidth={6} className="text-brand-600" />
              <span>Loading view...</span>
            </div>
          </div>
          <div className="h-4 w-72 bg-slate-100 rounded animate-pulse" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-9 w-28 bg-slate-200 rounded-lg animate-pulse" />
          <div className="h-9 w-32 bg-slate-200 rounded-lg animate-pulse" />
        </div>
      </div>

      {/* Metric Cards Skeleton Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-sm space-y-3"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 w-24 bg-slate-200 rounded animate-pulse" />
              <div className="w-7 h-7 rounded-lg bg-slate-100 animate-pulse" />
            </div>
            <div className="h-7 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-3 w-40 bg-slate-100 rounded animate-pulse" />
          </div>
        ))}
      </div>

      {/* Main Content Area Skeleton */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden p-6 space-y-5">
        {/* Table Toolbar Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="h-10 w-full sm:w-72 bg-slate-100 rounded-lg animate-pulse" />
          <div className="flex items-center gap-2">
            <div className="h-10 w-24 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-10 w-28 bg-slate-100 rounded-lg animate-pulse" />
          </div>
        </div>

        {/* Table Rows Skeleton */}
        <div className="space-y-3.5">
          <div className="h-8 bg-slate-50 rounded-lg flex items-center px-4 gap-6">
            <div className="h-3.5 w-24 bg-slate-200 rounded animate-pulse" />
            <div className="h-3.5 w-32 bg-slate-200 rounded animate-pulse" />
            <div className="h-3.5 w-28 bg-slate-200 rounded animate-pulse hidden md:block" />
            <div className="h-3.5 w-20 bg-slate-200 rounded animate-pulse ml-auto" />
          </div>

          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              className="h-12 border-b border-slate-100 flex items-center px-4 gap-6"
            >
              <div className="h-4 w-28 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-36 bg-slate-100 rounded animate-pulse" />
              <div className="h-4 w-24 bg-slate-100 rounded animate-pulse hidden md:block" />
              <div className="h-4 w-16 bg-slate-100 rounded animate-pulse ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
