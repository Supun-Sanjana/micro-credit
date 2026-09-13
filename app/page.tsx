"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Check, Users, LayoutGrid, FileText, CheckCircle2, Shield } from "lucide-react";
import { Navbar } from "@/components/marketing/navbar";
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
    <div className="relative min-h-screen bg-black selection:bg-brand-violet/30 selection:text-brand-violet-light">
      <div className="fixed inset-0 bg-noise pointer-events-none z-50 opacity-30 mix-blend-overlay" />
      <Navbar />
      
      <main className="flex flex-col items-center pt-16">
        {/* HERO SECTION */}
        <section className="relative w-full py-32 lg:py-48 flex justify-center overflow-hidden">
          {/* Subtle glowing orb */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-brand-violet/20 blur-[120px] rounded-full pointer-events-none opacity-50" />
          
          <motion.div 
            className="container px-4 md:px-6 text-center relative z-10"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <motion.div variants={fadeInUp} className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur-md mb-8">
              <span className="flex h-1.5 w-1.5 rounded-full bg-brand-violet-light mr-2 shadow-[0_0_8px_rgba(167,139,250,0.8)] animate-pulse"></span>
              Early Access Available
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="mx-auto max-w-4xl text-5xl font-medium tracking-tighter sm:text-6xl md:text-7xl lg:text-[5.5rem] leading-[1.1]">
              Replace the loan-collection <br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-white/40">
                spreadsheet.
              </span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="mx-auto mt-8 max-w-2xl text-lg text-white/50 tracking-tight leading-relaxed">
              Streamline branches, centers, and members. Track guarantors, manage weekly collection grids, and reconcile cash instantly with our modern platform.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/app/signup"
                className="group relative inline-flex h-11 items-center justify-center rounded-full bg-white px-8 text-sm font-semibold text-black transition-all hover:scale-105 active:scale-95 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
              >
                Start free trial 
                <ArrowRight className="ml-2 h-4 w-4 opacity-70 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#contact"
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 text-sm font-medium text-white/70 backdrop-blur-sm transition-all hover:bg-white/10 hover:text-white"
              >
                Request demo
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* SOCIAL PROOF */}
        <section className="w-full py-16 flex justify-center relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="container px-4 md:px-6">
            <p className="text-center text-xs font-medium text-white/30 mb-8 uppercase tracking-widest">
              Trusted by growing micro-finance institutions
            </p>
            <div className="flex flex-wrap justify-center gap-12 opacity-30 grayscale items-center">
              <div className="text-xl font-medium tracking-tight">SGP Institution</div>
              <div className="text-xl font-medium tracking-tight">FinanceCorp</div>
              <div className="text-xl font-medium tracking-tight">MicroLend</div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="w-full py-32 flex justify-center relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl font-medium tracking-tighter sm:text-4xl md:text-5xl">Everything you need. <br/><span className="text-white/40">Nothing you don't.</span></h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
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
                <div key={i} className="glass-card p-6 flex flex-col group">
                  <div className="mb-6 h-10 w-10 rounded-full border border-white/10 bg-white/5 flex items-center justify-center text-white/70 group-hover:bg-brand-violet/20 group-hover:text-brand-violet-light group-hover:border-brand-violet/30 transition-colors">
                    <feature.icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-lg font-medium tracking-tight text-white/90 mb-2">{feature.title}</h3>
                  <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="w-full py-32 flex justify-center relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute inset-0 bg-brand-violet/5 blur-[100px] pointer-events-none" />
          
          <div className="container px-4 md:px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-3xl font-medium tracking-tighter sm:text-4xl">Simple, transparent pricing</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mx-auto max-w-5xl items-center">
              {/* Free Plan */}
              <div className="glass-card p-8 flex flex-col h-full">
                <h3 className="text-lg font-medium tracking-tight text-white/90">Free</h3>
                <p className="text-white/40 mt-2 text-xs">For testing and small operations.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-medium tracking-tighter">$0</span>
                  <span className="text-white/40 text-sm">/mo</span>
                </div>
                
                <ul className="mt-8 space-y-4 flex-1">
                  {["1 Branch", "10 Staff Members", "20 Members", "100MB Storage"].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-white/30 shrink-0" />
                      <span className="text-sm text-white/60 tracking-tight">{item}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  href="/app/signup"
                  className="mt-8 flex h-10 w-full items-center justify-center rounded-lg border border-white/10 bg-white/5 text-sm font-medium text-white/90 transition-colors hover:bg-white/10"
                >
                  Get Started
                </Link>
              </div>

              {/* Standard Plan */}
              <div className="glass-card p-8 flex flex-col h-full relative overflow-hidden ring-1 ring-white/20 bg-white/[0.04]">
                <div className="absolute inset-0 bg-gradient-to-b from-brand-violet/10 to-transparent opacity-50" />
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-violet/50 to-transparent" />
                
                <div className="absolute top-4 right-4 px-2 py-0.5 rounded-full bg-brand-violet/20 border border-brand-violet/30 text-[10px] font-medium text-brand-violet-light tracking-wide uppercase">
                  Popular
                </div>
                
                <div className="relative z-10 flex flex-col h-full">
                  <h3 className="text-lg font-medium tracking-tight text-white">Standard</h3>
                  <p className="text-white/50 mt-2 text-xs">Everything you need to grow.</p>
                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-4xl font-medium tracking-tighter text-white">$49</span>
                    <span className="text-white/40 text-sm">/mo</span>
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
                        <Check className="h-4 w-4 text-brand-violet-light shrink-0" />
                        <span className="text-sm text-white/80 tracking-tight">{item}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Link
                    href="/app/signup"
                    className="mt-8 flex h-10 w-full items-center justify-center rounded-lg bg-white text-sm font-medium text-black transition-colors hover:bg-white/90 shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                  >
                    Start free trial
                  </Link>
                </div>
              </div>

              {/* Enterprise Plan */}
              <div className="glass-card p-8 flex flex-col h-full">
                <h3 className="text-lg font-medium tracking-tight text-white/90">Enterprise</h3>
                <p className="text-white/40 mt-2 text-xs">For large institutions.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-medium tracking-tighter">Custom</span>
                </div>
                
                <ul className="mt-8 space-y-4 flex-1">
                  {[
                    "Unlimited Branches",
                    "Unlimited Storage",
                    "Custom Workflows",
                    "Dedicated Account Manager"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3">
                      <Check className="h-4 w-4 text-white/30 shrink-0" />
                      <span className="text-sm text-white/60 tracking-tight">{item}</span>
                    </li>
                  ))}
                </ul>
                
                <Link
                  href="#contact"
                  className="mt-8 flex h-10 w-full items-center justify-center rounded-lg border border-white/10 bg-transparent text-sm font-medium text-white/90 transition-colors hover:bg-white/5"
                >
                  Contact Sales
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section id="contact" className="w-full py-32 flex justify-center relative">
          <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          <div className="container px-4 md:px-6 max-w-4xl relative z-10">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-3xl font-medium tracking-tighter mb-4">Ready to modernize?</h2>
                <p className="text-white/50 text-sm leading-relaxed mb-8">
                  Get in touch for a personalized demo or if you have specific migration questions. We're here to help.
                </p>
                <div className="space-y-6 text-sm text-white/70">
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center shrink-0 text-white/50">
                      <ArrowRight className="h-3 w-3" />
                    </div>
                    <span className="tracking-tight">Fast, assisted onboarding</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-full border border-white/10 bg-white/5 flex items-center justify-center shrink-0 text-white/50">
                      <ArrowRight className="h-3 w-3" />
                    </div>
                    <span className="tracking-tight">Data migration support</span>
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-6 md:p-8">
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label htmlFor="name" className="text-xs font-medium text-white/50">Name</label>
                      <input id="name" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder:text-white/20 focus:border-brand-violet/50 focus:outline-none focus:ring-1 focus:ring-brand-violet/50 transition-all" placeholder="Jane Doe" />
                    </div>
                    <div className="space-y-1.5">
                      <label htmlFor="org" className="text-xs font-medium text-white/50">Organization</label>
                      <input id="org" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder:text-white/20 focus:border-brand-violet/50 focus:outline-none focus:ring-1 focus:ring-brand-violet/50 transition-all" placeholder="Finance Inc." />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="text-xs font-medium text-white/50">Email</label>
                    <input id="email" type="email" className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder:text-white/20 focus:border-brand-violet/50 focus:outline-none focus:ring-1 focus:ring-brand-violet/50 transition-all" placeholder="jane@example.com" />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="message" className="text-xs font-medium text-white/50">Message</label>
                    <textarea id="message" rows={4} className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/90 placeholder:text-white/20 focus:border-brand-violet/50 focus:outline-none focus:ring-1 focus:ring-brand-violet/50 transition-all resize-none" placeholder="How can we help you?" />
                  </div>
                  <button type="submit" className="w-full mt-2 rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition-all hover:bg-white/90 active:scale-[0.98]">
                    Request Demo
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
