import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative bg-[#f7f1e8] rounded-3xl p-8 sm:p-12 overflow-hidden shadow-sm border border-[#d9cfc0]">
      <div className="container mx-auto relative z-10 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <Link href="/" className="flex flex-col mb-6">
              <span className="text-[28px] font-bold leading-none tracking-[-0.02em] text-[#166534]" style={{ fontFamily: "var(--font-outfit)" }}>solida</span>
            </Link>
            <p className="text-neutral-500 text-[14px] font-medium max-w-xs leading-relaxed">
              Operations software for microfinance institutions — branches, centers, weekly collections, and cash that reconciles.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-[14px] tracking-tight text-neutral-900 mb-6">Product</h3>
            <ul className="space-y-4">
              <li><Link href="#features" className="text-[14px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="text-[14px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold text-[14px] tracking-tight text-neutral-900 mb-6">Company</h3>
            <ul className="space-y-4">
              <li><Link href="https://cylvox.com" className="text-[14px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors">About Cylvox</Link></li>
              <li><Link href="#contact" className="text-[14px] font-medium text-neutral-500 hover:text-neutral-900 transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-neutral-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[13px] font-medium text-neutral-400 tracking-tight">
            &copy; 2026 Cylvox. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-[13px] font-medium text-neutral-400 hover:text-neutral-700 transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-[13px] font-medium text-neutral-400 hover:text-neutral-700 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}