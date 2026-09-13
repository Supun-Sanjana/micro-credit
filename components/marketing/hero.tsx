"use client";
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, ArrowRightCircle, Zap, Users, Shield } from "lucide-react";
import Link from "next/link";

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.15,
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

export function Hero() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="relative w-full min-h-screen font-sans text-[#192837] overflow-hidden" style={{ fontFamily: "var(--font-sans)" }}>
      {/* Background Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      >
        <source
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260518_003132_8b7edcb6-c64d-4a52-a9ca-879942e122ad.mp4"
          type="video/mp4"
        />
      </video>
      <div className="absolute inset-0 bg-white/20 backdrop-blur-[1px]" />

      {/* Navbar */}
      <nav className="relative z-10 max-w-[1280px] mx-auto px-5 sm:px-8 py-4 sm:py-5 flex items-center justify-between">
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#7c3aed]/50 p-[1px] shadow-[0_0_10px_rgba(124,58,237,0.2)]">
            <div className="w-full h-full rounded-[7px] bg-black flex items-center justify-center">
              <span className="text-white font-bold text-sm tracking-tighter">S</span>
            </div>
          </div>
          <span className="font-semibold text-lg tracking-tight text-[#192837]" style={{ fontFamily: "var(--font-heading)" }}>Solida</span>
        </Link>

        {/* Center: Links */}
        <div className="hidden md:flex items-center gap-8">
          {["Features", "Pricing", "About", "News", "Help"].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-medium text-[#192837] hover:opacity-70 transition-opacity"
            >
              {item}
            </Link>
          ))}
        </div>

        {/* Right: Actions */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/app/login"
            className="bg-[#F2F2EE] text-[#192837] text-sm font-medium rounded-full px-5 py-2.5 hover:bg-[#e5e5e0] transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/app/signup"
            className="bg-[#7c3aed] text-white text-sm font-medium rounded-full px-5 py-2.5 shadow-[0_4px_14px_rgba(124,58,237,0.28)] hover:brightness-110 hover:scale-[1.02] active:scale-[0.98] transition-all"
          >
            Early Access
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden flex items-center justify-center p-2 text-[#192837]"
          onClick={() => setIsMenuOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
      </nav>

      {/* Hero Content */}
      <div
        className="relative z-10 max-w-[1280px] mx-auto px-5 sm:px-8"
        style={{ paddingTop: "clamp(40px, 8vw, 72px)" }}
      >
        <div className="max-w-[560px]">
          <motion.h1
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-[#192837] mb-6 relative"
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "clamp(1.65rem, 5vw, 3rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
            }}
          >
            Scale Your Collections{" "}
            <Users className="inline-block w-6 h-6 text-[#192837] relative -top-[2px] mx-1" />{" "}
            with Ironclad{" "}
            <Shield className="inline-block w-6 h-6 text-[#192837] relative -top-[2px] mx-1" />{" "}
            Security{" "}
            <Zap className="inline-block w-6 h-6 text-[#192837] relative -top-[2px] ml-1" />
          </motion.h1>

          <motion.p
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="text-[#192837]/80"
            style={{
              fontSize: "clamp(0.9rem, 2.5vw, 1.1rem)",
              lineHeight: 1.65,
              maxWidth: "560px",
            }}
          >
            Zero stress, total control. Solida keeps you covered with hierarchical management, real-time collection grids, and pro-grade reporting for your growing institution.
          </motion.p>

          <motion.div
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-8 sm:mt-10"
          >
            <Link
              href="/app/signup"
              className="inline-flex items-center justify-between gap-8 bg-[#7c3aed] text-white rounded-full font-semibold transition-all hover:scale-[1.04] hover:brightness-110 active:scale-[0.96]"
              style={{
                padding: "17px 24px",
                fontSize: "clamp(0.9rem, 2vw, 1rem)",
                boxShadow: "0 4px 24px rgba(124,58,237,0.28)",
                minWidth: "210px",
              }}
            >
              Get Started
              <ArrowRightCircle className="w-5 h-5" />
            </Link>
          </motion.div>
        </div>
      </div>

      {/* Mobile Menu Sheet */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-40 bg-[#192837]/35 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.45 }}
              className="fixed top-0 right-0 h-[100dvh] w-[min(88vw,360px)] bg-[#F2F2EE] shadow-[-12px_0_48px_rgba(25,40,55,0.18)] z-50 flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-[#192837]/10">
                <span className="font-semibold text-lg tracking-tight text-[#192837]" style={{ fontFamily: "var(--font-heading)" }}>Solida</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 text-[#192837]">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="flex flex-col p-5 gap-6">
                {["Features", "Pricing", "About", "News", "Help"].map((item, i) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.18 + i * 0.07, duration: 0.4 }}
                  >
                    <Link
                      href={`#${item.toLowerCase()}`}
                      onClick={() => setIsMenuOpen(false)}
                      className="text-lg font-medium text-[#192837]"
                    >
                      {item}
                    </Link>
                  </motion.div>
                ))}
              </div>
              <div className="mt-auto p-5 flex flex-col gap-3">
                <Link
                  href="/app/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full text-center bg-white border border-[#192837]/10 text-[#192837] text-sm font-medium rounded-full px-5 py-3"
                >
                  Log In
                </Link>
                <Link
                  href="/app/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full text-center bg-[#7c3aed] text-white text-sm font-medium rounded-full px-5 py-3"
                >
                  Early Access
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}