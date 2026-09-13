"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function Navbar() {
  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 z-50 w-full"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xl border-b border-white/[0.05] [mask-image:linear-gradient(to_bottom,black_60%,transparent)]" />
      <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between relative">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-green to-brand-green/50 p-[1px] shadow-[0_0_15px_rgba(22,101,52,0.3)]">
            <div className="w-full h-full rounded-[7px] bg-black flex items-center justify-center transition-colors group-hover:bg-brand-green/10">
              <span className="text-white font-bold text-sm tracking-tighter">S</span>
            </div>
          </div>
          <span className="font-medium text-sm tracking-tight text-white/90 group-hover:text-white transition-colors">Solida</span>
        </Link>
        
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-white/50 hover:text-white transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-white/50 hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="#contact" className="text-sm font-medium text-white/50 hover:text-white transition-colors">
            Contact
          </Link>
        </div>

        <div className="flex items-center gap-5">
          <Link 
            href="/app/login" 
            className="hidden sm:block text-sm font-medium text-white/50 hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link 
            href="/app/signup"
            className="inline-flex h-8 items-center justify-center rounded-full bg-white px-4 text-xs font-semibold text-black transition-all hover:bg-white/90 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          >
            Get Started
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
