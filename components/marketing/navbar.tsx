"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Loader2, ArrowRight } from "lucide-react";
import { triggerNavigationProgress } from "@/components/top-loading-bar";

export function Navbar() {
  const [navigatingTo, setNavigatingTo] = useState<string | null>(null);
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";

  const handleNavClick = (href: string) => {
    setNavigatingTo(href);
    triggerNavigationProgress("start");
  };

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 z-50 w-full"
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xl border-b border-white/[0.05] [mask-image:linear-gradient(to_bottom,black_60%,transparent)]" />
      <div className="container mx-auto px-4 md:px-8 h-16 flex items-center justify-between relative">
        <Link href="/" className="flex flex-col group">
          <span className="text-[28px] font-bold leading-none tracking-[-0.02em] text-[#166534] group-hover:opacity-80 transition-opacity" style={{ fontFamily: "var(--font-outfit)" }}>solida</span>
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
          {isAuthenticated ? (
            <Link 
              href="/app/dashboard"
              onClick={() => handleNavClick("/app/dashboard")}
              className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-[#166534] px-4 text-xs font-semibold text-white transition-all hover:bg-[#166534]/90 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(22,101,52,0.2)]"
            >
              {navigatingTo === "/app/dashboard" ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </Link>
          ) : (
            <>
              <Link 
                href="/app/login" 
                onClick={() => handleNavClick("/app/login")}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-white/50 hover:text-white transition-colors"
              >
                {navigatingTo === "/app/login" && <Loader2 className="w-3.5 h-3.5 animate-spin text-white/70" />}
                <span>Log in</span>
              </Link>
              <Link 
                href="/app/signup"
                onClick={() => handleNavClick("/app/signup")}
                className="inline-flex h-8 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-xs font-semibold text-black transition-all hover:bg-white/90 hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
              >
                {navigatingTo === "/app/signup" ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-black" />
                    <span>Loading...</span>
                  </>
                ) : (
                  <span>Get Started</span>
                )}
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
