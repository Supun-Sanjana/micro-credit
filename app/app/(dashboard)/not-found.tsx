import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function AppNotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-navy-900">
      <div className="flex flex-col items-center text-center max-w-md w-full rounded-[24px] border border-[#ececec] bg-slate-50 p-10 shadow-subtle-3">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/40 bg-white text-slate-500">
          <AlertCircle className="h-8 w-8" />
        </div>
        
        <h1 className="text-[28px] font-sans font-medium text-navy-900 mb-3">
          View Not Found
        </h1>
        
        <p className="mb-8 text-[15px] text-slate-500 leading-relaxed">
          The dashboard view or record you are trying to access doesn't exist or you don't have permission to view it.
        </p>

        <Link
          href="/app/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-6 py-3 text-[14px] font-medium text-white transition-opacity hover:opacity-90"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
