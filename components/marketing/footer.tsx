import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-black py-16 overflow-hidden">
      <div className="absolute inset-0 bg-noise pointer-events-none opacity-30 mix-blend-overlay" />
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-brand-violet to-brand-violet/50 p-[1px] shadow-[0_0_10px_rgba(124,58,237,0.2)]">
                <div className="w-full h-full rounded-[3px] bg-black flex items-center justify-center">
                  <span className="text-white font-bold text-[10px] tracking-tighter">S</span>
                </div>
              </div>
              <span className="font-medium text-sm tracking-tight text-white/90">Solida</span>
            </Link>
            <p className="text-white/40 text-sm max-w-xs leading-relaxed">
              Modern loan-collection and micro-finance management. Replace spreadsheets with a streamlined platform.
            </p>
          </div>
          <div>
            <h3 className="font-medium text-sm tracking-tight text-white/90 mb-6">Product</h3>
            <ul className="space-y-4">
              <li><Link href="#features" className="text-sm text-white/40 hover:text-white transition-colors">Features</Link></li>
              <li><Link href="#pricing" className="text-sm text-white/40 hover:text-white transition-colors">Pricing</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-sm tracking-tight text-white/90 mb-6">Company</h3>
            <ul className="space-y-4">
              <li><Link href="https://cylvox.com" className="text-sm text-white/40 hover:text-white transition-colors">About Cylvox</Link></li>
              <li><Link href="#contact" className="text-sm text-white/40 hover:text-white transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-white/30 tracking-tight">
            &copy; {new Date().getFullYear()} Cylvox. All rights reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="text-xs text-white/30 hover:text-white/70 transition-colors">Privacy Policy</Link>
            <Link href="#" className="text-xs text-white/30 hover:text-white/70 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
