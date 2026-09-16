import Link from "next/link";
import { AlertCircle, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#efe8dc] p-4 text-[#14231c] font-sans selection:bg-[#166534]/25 selection:text-[#166534]">
      <div className="flex flex-col items-center text-center max-w-md w-full rounded-[28px] border border-[#d9cfc0] bg-[#f7f1e8] p-10 shadow-sm">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#e4d9c8] bg-white text-[#c9943e]">
          <AlertCircle className="h-8 w-8" />
        </div>
        
        <h1 
          className="text-4xl tracking-tight sm:text-5xl mb-4"
          style={{ fontFamily: "var(--font-instrument), Georgia, serif", fontStyle: "italic" }}
        >
          Page Not Found
        </h1>
        
        <p className="mb-8 text-[15px] font-medium leading-relaxed text-[#5d6b63]">
          The page you are looking for does not exist or may have been moved.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#10261c] px-6 py-3 text-[14px] font-semibold text-[#f4efe6] shadow-md transition-all hover:scale-[1.02] hover:bg-[#0c1c15] active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          Return to Homepage
        </Link>
      </div>
    </div>
  );
}
