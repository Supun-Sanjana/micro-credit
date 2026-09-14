"use client";

import React, { useState } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import {
  Menu,
  X,
  ArrowRight,
  CircleDot,
  Landmark,
  UsersRound,
} from "lucide-react";
import Link from "next/link";

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: (custom: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: custom * 0.12,
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1] as any,
    },
  }),
};

const navItems = [
  { label: "Operations", href: "#operations" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

export function Hero() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="relative w-full overflow-hidden rounded-[28px] bg-[#10261c] text-[#f4efe6] font-sans">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(80% 60% at 80% 20%, rgba(201, 148, 62, 0.18), transparent 55%), radial-gradient(50% 40% at 10% 80%, rgba(22, 101, 52, 0.16), transparent 50%)",
        }}
      />

      <nav className="relative z-10 mx-auto flex max-w-[1280px] items-center justify-between px-5 py-4 sm:px-8 sm:py-5">
        {/* Left: Logo */}
        <Link href="/" className="flex flex-col">
          <span className="text-[32px] font-bold leading-none tracking-[-0.02em] text-white" style={{ fontFamily: "var(--font-outfit)" }}>solida</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-[#f4efe6]/75 transition-opacity hover:text-[#f4efe6]"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/app/login"
            className="rounded-full bg-white/10 px-5 py-2.5 text-sm font-medium text-[#f4efe6] transition-colors hover:bg-white/16"
          >
            Log In
          </Link>
          <Link
            href="/app/signup"
            className="rounded-full bg-[#166534] px-5 py-2.5 text-sm font-medium text-white shadow-[0_4px_14px_rgba(22,101,52,0.35)] transition-all hover:brightness-110"
          >
            Start free trial
          </Link>
        </div>

        <button
          className="flex items-center justify-center p-2 text-[#f4efe6] md:hidden"
          onClick={() => setIsMenuOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </nav>

      <div className="relative z-10 mx-auto grid max-w-[1280px] items-center gap-10 px-5 pb-12 pt-6 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14 lg:pb-16 lg:pt-8">
        <div>
          <motion.p
            custom={0}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1.5 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#e6c27a]"
          >
            <CircleDot className="h-3.5 w-3.5" />
            For microfinance institutions
          </motion.p>

          <motion.h1
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mb-5 text-[#f7f1e6]"
            style={{
              fontFamily: "var(--font-instrument), Georgia, serif",
              fontSize: "clamp(2.1rem, 5.2vw, 3.7rem)",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              fontStyle: "italic",
            }}
          >
            The ledger that follows the center meeting.
          </motion.h1>

          <motion.p
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="max-w-[540px] text-[15px] font-medium leading-relaxed text-[#f4efe6]/78 sm:text-[17px]"
          >
            Solida is built for last-mile lending: branches, centers, guarantors,
            weekly collections, and cash that has to reconcile before dusk â€” not
            generic banking software dressed up as inclusion.
          </motion.p>

          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-8 flex flex-wrap items-center gap-3"
          >
            <Link
              href="/app/signup"
              className="inline-flex items-center gap-2 rounded-full bg-[#166534] px-6 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_28px_rgba(22,101,52,0.32)] transition-transform hover:scale-[1.03] active:scale-[0.98]"
            >
              Run your first collection
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#operations"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-[15px] font-semibold text-[#f4efe6] transition-colors hover:bg-white/8"
            >
              See how MFIs operate
            </Link>
          </motion.div>

          <motion.div
            custom={4}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/12 pt-8"
          >
            {[
              { value: "PAR", label: "visible by center" },
              { value: "Weekly", label: "installment grids" },
              { value: "EOD", label: "cash reconciliation" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-lg font-semibold tracking-tight text-[#f7f1e6]">{stat.value}</div>
                <div className="mt-1 text-[12px] font-medium leading-snug text-[#f4efe6]/60">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="relative"
        >
          <div className="overflow-hidden rounded-[24px] border border-white/12 bg-[#f4efe6] text-[#14231c] shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="flex items-center justify-between border-b border-[#d9cfc0] bg-[#f7f1e8] px-4 py-3 sm:px-5">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c9943e]">
                  Center 14 Â· Tuesday meeting
                </p>
                <p className="mt-0.5 text-sm font-semibold tracking-tight">Weekly collection grid</p>
              </div>
              <div className="rounded-full bg-[#10261c] px-3 py-1 text-[11px] font-semibold text-[#e6c27a]">
                42 / 48 paid
              </div>
            </div>

            <div className="grid grid-cols-[1.4fr_0.7fr_0.9fr] gap-2 border-b border-[#e6dccf] px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-[#8a948e] sm:px-5">
              <span>Member</span>
              <span>Due</span>
              <span>Status</span>
            </div>

            <ul className="divide-y divide-[#e6dccf] px-2 py-1 sm:px-3">
              {[
                { name: "Nimali Perera", due: "LKR 3,200", status: "Paid" as const },
                { name: "Kamala Silva", due: "LKR 3,200", status: "Paid" as const },
                { name: "Ranjith Fernando", due: "LKR 4,800", status: "Partial" as const },
                { name: "Sithara Jayasuriya", due: "LKR 3,200", status: "Paid" as const },
                { name: "Anusha Wijesinghe", due: "LKR 3,200", status: "Arrears" as const },
                { name: "Malini Dissanayake", due: "LKR 2,400", status: "Paid" as const },
              ].map((row) => (
                <li key={row.name} className="grid grid-cols-[1.4fr_0.7fr_0.9fr] items-center gap-2 px-2 py-2.5 sm:px-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#10261c] text-[10px] font-semibold text-[#e6c27a]">
                      {row.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                    <span className="truncate text-[13px] font-medium">{row.name}</span>
                  </div>
                  <span className="text-[12px] font-medium text-[#5d6b63]">{row.due}</span>
                  <span
                    className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                      row.status === "Paid"
                        ? "bg-[#dceee3] text-[#1f6b45]"
                        : row.status === "Partial"
                          ? "bg-[#f3e6c8] text-[#8a5a12]"
                          : "bg-[#f3d6d1] text-[#9a3b2f]"
                    }`}
                  >
                    {row.status}
                  </span>
                </li>
              ))}
            </ul>

            <div className="grid grid-cols-2 gap-3 border-t border-[#d9cfc0] bg-[#f7f1e8] p-4 sm:p-5">
              <div className="rounded-2xl border border-[#d9cfc0] bg-white p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#c9943e]">
                  <Landmark className="h-3.5 w-3.5" />
                  Collected
                </div>
                <p className="text-sm font-semibold">LKR 186,400</p>
              </div>
              <div className="rounded-2xl border border-[#d9cfc0] bg-white p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#c9943e]">
                  <UsersRound className="h-3.5 w-3.5" />
                  PAR 30
                </div>
                <p className="text-sm font-semibold">2.4% Â· flagged</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-40 bg-[#10261c]/50 backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ ease: [0.22, 1, 0.36, 1], duration: 0.45 }}
              className="fixed right-0 top-0 z-50 flex h-[100dvh] w-[min(88vw,360px)] flex-col bg-[#f4efe6] text-[#10261c] shadow-[-12px_0_48px_rgba(16,38,28,0.18)]"
            >
              <div className="flex items-center justify-between border-b border-[#10261c]/10 p-5">
                <span
                  className="text-[28px] font-bold leading-none tracking-[-0.02em] text-[#166534]"
                  style={{ fontFamily: "var(--font-outfit)" }}
                >
                  solida
                </span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2" aria-label="Close menu">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="flex flex-col gap-6 p-5">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="text-lg font-medium"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-auto flex flex-col gap-3 p-5">
                <Link
                  href="/app/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full rounded-full border border-[#10261c]/10 bg-white px-5 py-3 text-center text-sm font-medium"
                >
                  Log In
                </Link>
                <Link
                  href="/app/signup"
                  onClick={() => setIsMenuOpen(false)}
                  className="w-full rounded-full bg-[#166534] px-5 py-3 text-center text-sm font-medium text-white"
                >
                  Start free trial
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
