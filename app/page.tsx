"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check, Users, LayoutGrid, FileText, CheckCircle2, Shield } from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { Footer } from "@/components/marketing/footer";

const spring = {
  type: "spring",
  stiffness: 100,
  damping: 20,
};

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: spring,
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#ededed] text-neutral-900 font-sans selection:bg-brand-violet/30 selection:text-brand-violet p-3 sm:p-4">
      {/* Remove dark theme noise */}
      <main className="flex flex-col items-center">
        <Hero />

        {/* SOCIAL PROOF */}
        <section className="w-full py-16 flex justify-center relative mt-10">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-neutral-300 to-transparent" />
          <div className="container px-4 md:px-6">
            <p className="text-center text-[13px] font-medium text-neutral-500 mb-8 uppercase tracking-widest">
              Trusted by growing micro-finance institutions
            </p>
            <div className="flex flex-wrap justify-center gap-12 opacity-60 grayscale items-center">
              <div className="text-xl font-medium tracking-tight text-neutral-800">SGP Institution</div>
              <div className="text-xl font-medium tracking-tight text-neutral-800">FinanceCorp</div>
              <div className="text-xl font-medium tracking-tight text-neutral-800">MicroLend</div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="w-full py-24 flex justify-center relative">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl sm:text-5xl md:text-6xl tracking-tighter text-neutral-900 font-instrument italic">
                Everything you need. <br/><span className="text-neutral-400 not-italic font-sans font-medium text-3xl sm:text-4xl md:text-5xl block mt-2 tracking-tighter">Nothing you don't.</span>
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
              {[
                {
                  icon: Users,
                  title: "Hierarchical Management",
                  description: "Organize operations flawlessly across Branches, Centers, and individual Members."
                },
                {
                  icon: CheckCircle2,
                  title: "Guarantor Tracking",
                  description: "Link members to guarantors with clear visibility into relationships and liabilities."
                },
                {
                  icon: LayoutGrid,
                  title: "Weekly Collection Grid",
                  description: "A fast, spreadsheet-like interface for field officers to enter collections instantly."
                },
                {
                  icon: FileText,
                  title: "Cash Reconciliation",
                  description: "End-of-day tallying made simple. Match physical cash to system entries effortlessly."
                },
                {
                  icon: Users, 
                  title: "Advanced Reporting",
                  description: "Exportable reports for arrears, collection rates, and portfolio health."
                },
                {
                  icon: Shield,
                  title: "Role-Based Access",
                  description: "Secure, granular permissions for field officers, branch managers, and admins."
                }
              ].map((feature, i) => (
                <div key={i} className="bg-white rounded-3xl p-6 md:p-8 flex flex-col group shadow-sm border border-neutral-200/60 hover:shadow-md transition-all">
                  <div className="mb-6 h-12 w-12 rounded-2xl border border-neutral-100 bg-neutral-50 flex items-center justify-center text-neutral-500 group-hover:bg-brand-violet/10 group-hover:text-brand-violet group-hover:border-brand-violet/20 transition-colors">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight text-neutral-900 mb-2">{feature.title}</h3>
                  <p className="text-[14px] text-neutral-500 leading-relaxed font-medium">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="w-full py-24 flex justify-center relative">
          <div className="absolute inset-0 bg-brand-violet/5 blur-[100px] pointer-events-none" />
          
          <div className="container px-4 md:px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl sm:text-5xl font-instrument italic tracking-tighter text-neutral-900">Simple, transparent pricing</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mx-auto max-w-5xl items-center">
              {/* Free Plan */}
              <div className="bg-white rounded-3xl p-8 flex flex-col h-full shadow-sm border border-neutral-200/60">
                <h3 className="text-lg font-semibold tracking-tight text-neutral-900">Free</h3>
                <p className="text-neutral-500 mt-2 text-[13px] font-medium">For testing and small operations.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-semibold tracking-tighter text-neutral-900">$0</span>
                  <span className="text-neutral-400 text-sm font-medium">/mo</span>
                </div>
                
                <ul className="mt-8 space-y-4 flex-1">
                  {["1 Branch", "10 Staff Members", "20 Members", "100MB Storage"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-neutral-300 shrink-0" />
                      <span className="text-[14px] font-medium text-neutral-600 tracking-tight">{item}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  href="/app/signup"
                  className="mt-8 flex h-11 w-full items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50 text-[14px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                >
                  Get Started
                </Link>
              </div>

              {/* Standard Plan */}
              <div className="bg-white rounded-3xl p-8 flex flex-col h-full relative overflow-hidden shadow-xl border border-[#7c3aed]/20 ring-4 ring-[#7c3aed]/5">
                <div className="absolute inset-0 bg-gradient-to-b from-[#7c3aed]/5 to-transparent pointer-events-none" />
                
                <div className="absolute top-5 right-5 px-3 py-1 rounded-full bg-[#7c3aed]/10 text-[11px] font-semibold text-[#7c3aed] tracking-wide uppercase">
                  Popular
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-lg font-semibold tracking-tight text-neutral-900">Standard</h3>
                  <p className="text-neutral-500 mt-2 text-[13px] font-medium">Everything you need to grow.</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-5xl font-semibold tracking-tighter text-neutral-900">$49</span>
                    <span className="text-neutral-400 text-sm font-medium">/mo</span>
                  </div>
                  
                  <ul className="mt-8 space-y-4 flex-1">
                    {[
                      "Unlimited Members & Centers",
                      "Up to 5 Branches",
                      "Guarantor Tracking",
                      "Weekly Collection Grids",
                      "Email Support"
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <Check className="h-4 w-4 text-[#7c3aed] shrink-0" />
                        <span className="text-[14px] font-medium text-neutral-700 tracking-tight">{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    href="/app/signup"
                    className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-[#0b0f1a] text-[14px] font-semibold text-white transition-all hover:bg-black hover:scale-[1.02] active:scale-[0.98] shadow-md"
                  >
                    Start free trial
                  </Link>
                </div>
              </div>

              {/* Enterprise Plan */}
              <div className="bg-white rounded-3xl p-8 flex flex-col h-full shadow-sm border border-neutral-200/60">
                <h3 className="text-lg font-semibold tracking-tight text-neutral-900">Enterprise</h3>
                <p className="text-neutral-500 mt-2 text-[13px] font-medium">For large institutions.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-semibold tracking-tighter text-neutral-900">Custom</span>
                </div>
                
                <ul className="mt-8 space-y-4 flex-1">
                  {[
                    "Unlimited Branches",
                    "Unlimited Storage",
                    "Custom Workflows",
                    "Dedicated Account Manager"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-neutral-300 shrink-0" />
                      <span className="text-[14px] font-medium text-neutral-600 tracking-tight">{item}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  href="#contact"
                  className="mt-8 flex h-11 w-full items-center justify-center rounded-xl border border-neutral-200 bg-transparent text-[14px] font-semibold text-neutral-700 transition-colors hover:bg-neutral-50"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="w-full py-24 flex justify-center relative mb-12">
          <div className="container px-4 md:px-6 max-w-5xl relative z-10">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl sm:text-5xl font-instrument italic tracking-tighter text-neutral-900 mb-6">Ready to modernize?</h2>
                <p className="text-neutral-500 text-[15px] font-medium leading-relaxed mb-10 max-w-sm">
                  Get in touch for a personalized demo or if you have specific migration questions. We're here to help.
                </p>
                <div className="space-y-6 text-[14px] font-medium text-neutral-700">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl border border-neutral-200 bg-white flex items-center justify-center shrink-0 text-neutral-400 shadow-sm">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <span className="tracking-tight">Fast, assisted onboarding</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-2xl border border-neutral-200 bg-white flex items-center justify-center shrink-0 text-neutral-400 shadow-sm">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <span className="tracking-tight">Data migration support</span>
                  </div>
                </div>
                <div className="mt-12 pt-8 border-t border-neutral-200">
                  <p className="text-neutral-400 text-xs font-semibold tracking-wider uppercase mb-4">Or email us directly</p>
                  <a href="mailto:solida@cylvox.com" className="inline-flex items-center gap-3 text-neutral-800 hover:text-black transition-colors">
                    <div className="h-10 w-10 rounded-2xl bg-[#7c3aed]/10 flex items-center justify-center text-[#7c3aed]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                    <span className="font-semibold tracking-tight">solida@cylvox.com</span>
                  </a>
                </div>
              </div>
              
              <div className="bg-white rounded-3xl p-6 md:p-8 shadow-xl shadow-black/5 border border-neutral-200/60">
                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-[13px] font-semibold text-neutral-700">Name</label>
                      <input id="name" className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#7c3aed] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 transition-all font-medium" placeholder="Jane Doe" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="org" className="text-[13px] font-semibold text-neutral-700">Organization</label>
                      <input id="org" className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#7c3aed] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 transition-all font-medium" placeholder="Finance Inc." />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-[13px] font-semibold text-neutral-700">Email</label>
                    <input id="email" type="email" className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-2.5 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#7c3aed] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 transition-all font-medium" placeholder="jane@example.com" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-[13px] font-semibold text-neutral-700">Message</label>
                    <textarea id="message" rows={4} className="w-full rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-[14px] text-neutral-900 placeholder:text-neutral-400 focus:border-[#7c3aed] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#7c3aed]/20 transition-all resize-none font-medium" placeholder="How can we help you?" />
                  </div>
                  <button type="submit" className="w-full mt-2 rounded-xl bg-[#0b0f1a] px-4 py-3 text-[14px] font-semibold text-white transition-all hover:bg-black active:scale-[0.98] shadow-md">
                    Request Demo
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <div className="px-3 sm:px-4 pb-3 sm:pb-4">
        <Footer />
      </div>
    </div>
  );
}