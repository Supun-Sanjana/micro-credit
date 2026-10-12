import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarDays,
  Repeat,
  BookOpenCheck,
  ShieldAlert,
  FileCheck2,
  WifiOff,
  PiggyBank,
  GitFork,
  UserCheck,
  Check,
  ArrowRight,
  Mail,
  Sparkles,
} from "lucide-react";

import { Hero } from "@/components/marketing/hero";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { Footer } from "@/components/marketing/footer";
import { SUBSCRIPTION_PLANS } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Solida | Core Banking & Operations Software for Microfinance",
  description:
    "Enterprise microfinance core banking platform: offline field collections, automated repayment schedules, double-entry accounting, PAR 1/7/30/90 risk intelligence, and member KYC.",
  keywords: [
    "microfinance software",
    "microcredit core banking",
    "field collection app",
    "offline loan management",
    "group lending software",
    "microfinance Sri Lanka",
    "loan portfolio at risk",
    "double entry accounting MFI",
    "community lending software",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Solida | Core Banking for Modern Microfinance Institutions",
    description:
      "Built for last-mile lending: branches, centers, weekly collections, and cash that reconciles before dusk.",
    url: "/",
    siteName: "Solida MFI",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Solida | Core Banking for Modern Microfinance Institutions",
    description:
      "Built for last-mile lending: branches, centers, weekly collections, and cash that reconciles before dusk.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "name": "Solida",
      "applicationCategory": "BusinessApplication",
      "operatingSystem": "All modern browsers, PWA for Android/iOS",
      "description":
        "Core banking and operations platform for microfinance institutions with offline field collections and automated accounting.",
      "offers": {
        "@type": "AggregateOffer",
        "priceCurrency": "LKR",
        "lowPrice": "7500",
        "highPrice": "35000",
        "offerCount": "3",
      },
    },
    {
      "@type": "Organization",
      "name": "Solida by Cylvox",
      "url": "https://solida.cylvox.com",
      "logo": "https://solida.cylvox.com/icon.svg",
      "sameAs": ["https://cylvox.com"],
    },
  ],
};

export default function MarketingLandingPage() {
  const operationsHighlights = [
    {
      title: "Center meeting collections",
      description:
        "Weekly installment sheets, offline-capable field recording, and instant automated cash reconciliation.",
      icon: CalendarDays,
      detail: "Fast roster checklists with zero calculation errors.",
    },
    {
      title: "Full loan lifecycle",
      description:
        "Draft → Verified → Disbursed → Active with complete audit histories and granular installment tracking.",
      icon: Repeat,
      detail: "Configurable interest rates, grace periods, and penal fees.",
    },
    {
      title: "Double-entry accounting",
      description:
        "Auto-generated balanced journal entries on every disbursement, repayment, fee, and adjustment.",
      icon: BookOpenCheck,
      detail: "Real-time general ledger without tedious manual bookkeeping.",
    },
  ];

  const featuresList = [
    {
      title: "PAR & Risk Monitoring",
      description:
        "Track Portfolio At Risk (PAR 1, 7, 30, 90) in real time with loan aging matrices and automated alerts for overdue accounts.",
      icon: ShieldAlert,
    },
    {
      title: "Member KYC & Documents",
      description:
        "Digitize member profiles, national identity cards (NIC), guarantor verifications, and signed collateral documentation.",
      icon: FileCheck2,
    },
    {
      title: "Offline PWA Field App",
      description:
        "Field officers collect repayments anywhere — even with zero cellular signal. Data seamlessly syncs upon reconnection.",
      icon: WifiOff,
    },
    {
      title: "Savings Accounts",
      description:
        "Manage compulsory and voluntary member savings, track deposit balances, and calculate interest with transparency.",
      icon: PiggyBank,
    },
    {
      title: "Branch & Centre Hierarchy",
      description:
        "Organize multi-tier branch structures, centers, and borrower groups with dedicated officer allocations and schedules.",
      icon: GitFork,
    },
    {
      title: "Multi-role Access Control",
      description:
        "Granular permissions for Head Office executives, Branch Managers, Field Officers, and internal Auditors.",
      icon: UserCheck,
    },
  ];

  return (
    <main className="w-full">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 1. Hero Section */}
      <section className="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto">
        <Hero />
      </section>

      {/* 2. Operations / How It Works */}
      <section id="operations" className="py-24 sm:py-32 scroll-mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span
              className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#e6c27a] mb-3 inline-block"
            >
              Operations That Work
            </span>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl text-white font-normal tracking-tight italic"
              style={{ fontFamily: "var(--font-instrument)" }}
            >
              Field operations engineered for zero discrepancies
            </h2>
            <p className="mt-5 text-neutral-400 text-base sm:text-lg leading-relaxed font-sans">
              From dusty field center meetings to Head Office boardrooms, Solida
              eliminates paper collection sheets, fraud vectors, and spreadsheet chaos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {operationsHighlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-white/20 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-[#166534]/30 border border-[#166534]/50 flex items-center justify-center text-[#e6c27a] mb-6">
                      <Icon className="w-6 h-6 text-[#f4efe6]" />
                    </div>
                    <h3 className="text-xl font-semibold text-white mb-3">
                      {item.title}
                    </h3>
                    <p className="text-neutral-400 text-sm leading-relaxed mb-4">
                      {item.description}
                    </p>
                  </div>
                  <div className="pt-4 border-t border-white/5 text-xs text-[#e6c27a] font-medium flex items-center gap-1.5">
                    <span>{item.detail}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 3. Features Grid */}
      <section id="features" className="py-24 sm:py-32 scroll-mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span
              className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#e6c27a] mb-3 inline-block"
            >
              Comprehensive Suite
            </span>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl text-white font-normal tracking-tight italic"
              style={{ fontFamily: "var(--font-instrument)" }}
            >
              Everything modern microfinance demands
            </h2>
            <p className="mt-5 text-neutral-400 text-base sm:text-lg leading-relaxed font-sans">
              Built ground-up with compliance, group lending methodology, and
              rock-solid security at its foundation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {featuresList.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div
                  key={idx}
                  className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-white/20 hover:bg-white/[0.07] transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center mb-6 text-[#e6c27a]">
                      <Icon className="w-5 h-5 text-[#e6c27a]" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2.5">
                      {feature.title}
                    </h3>
                    <p className="text-neutral-400 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. Dashboard Preview Section */}
      <section className="py-24 sm:py-32">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 text-center">
          <span
            className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#e6c27a] mb-3 inline-block"
          >
            Real-Time Visibility
          </span>
          <h2
            className="text-4xl sm:text-5xl lg:text-6xl text-white font-normal tracking-tight italic mb-5"
            style={{ fontFamily: "var(--font-instrument)" }}
          >
            Built for the field and the head office alike
          </h2>
          <p className="text-neutral-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed font-sans">
            Branch managers track live portfolio collection metrics, field officer
            targets, and delinquency ratios in a clean, high-clarity workspace.
          </p>

          <div className="mt-8">
            <DashboardPreview />
          </div>
        </div>
      </section>

      {/* 5. Pricing Section */}
      <section id="pricing" className="py-24 sm:py-32 scroll-mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span
              className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#e6c27a] mb-3 inline-block"
            >
              Transparent Pricing
            </span>
            <h2
              className="text-4xl sm:text-5xl lg:text-6xl text-white font-normal tracking-tight italic"
              style={{ fontFamily: "var(--font-instrument)" }}
            >
              Scalable plans that grow with your institution
            </h2>
            <p className="mt-5 text-neutral-400 text-base sm:text-lg leading-relaxed font-sans">
              All plans include complete core features, bank-grade encryption, and
              a full 14-day free trial. No credit card required to start.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const topFeatures = plan.featureGroups[0]?.features.slice(0, 5) || [];
              const isGrowth = Boolean(plan.highlighted);

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-3xl p-8 sm:p-10 transition-all ${
                    isGrowth
                      ? "bg-[#10261c] border-2 border-[#166534] shadow-[0_0_40px_rgba(22,101,52,0.3)] lg:-translate-y-2"
                      : "bg-white/5 border border-white/10 hover:border-white/20"
                  }`}
                >
                  {/* Top highlight / badge */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#e6c27a] bg-[#e6c27a]/10 px-3 py-1 rounded-full border border-[#e6c27a]/20">
                        {plan.badge || plan.name}
                      </span>
                      <span className="text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                        14-Day Free Trial
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-neutral-400 text-sm leading-relaxed mb-6 min-h-[42px]">
                      {plan.tagline}
                    </p>

                    <div className="mb-6 pb-6 border-b border-white/10">
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl sm:text-4xl font-extrabold text-white">
                          LKR {plan.monthlyPrice.toLocaleString()}
                        </span>
                        <span className="text-neutral-400 text-sm">/ month</span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-neutral-300">
                        <span className="bg-white/10 px-2.5 py-1 rounded-lg">
                          {plan.maxOfficerSeats} Officer seats
                        </span>
                        <span className="bg-white/10 px-2.5 py-1 rounded-lg">
                          {plan.maxBranches} {plan.maxBranches === 1 ? "Branch" : "Branches"}
                        </span>
                        <span className="bg-white/10 px-2.5 py-1 rounded-lg">
                          {plan.storageDisplay} storage
                        </span>
                      </div>
                    </div>

                    {/* Features list */}
                    <div className="space-y-3 mb-8">
                      <p className="text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                        Included Features
                      </p>
                      {topFeatures.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-3 text-sm text-neutral-300">
                          <div className="mt-0.5 rounded-full bg-[#166534]/40 p-0.5 text-emerald-400 shrink-0">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <div>
                    <Link
                      href="/app/signup"
                      className={`w-full py-3.5 px-6 rounded-2xl font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                        isGrowth
                          ? "bg-[#166534] hover:bg-[#166534]/90 text-white shadow-[0_4px_14px_rgba(22,101,52,0.4)]"
                          : "bg-white/10 hover:bg-white/20 text-white"
                      }`}
                    >
                      <span>Start free trial</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 6. Contact / CTA Section */}
      <section id="contact" className="py-24 sm:py-32 scroll-mt-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-8">
          <div className="bg-[#10261c] border border-white/10 rounded-3xl p-8 sm:p-14 lg:p-16 text-center relative overflow-hidden shadow-2xl">
            <div
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{
                background:
                  "radial-gradient(70% 60% at 50% 30%, rgba(201, 148, 62, 0.15), transparent 60%)",
              }}
            />

            <div className="relative z-10 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-[#e6c27a] mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zero Risk Onboarding</span>
              </div>

              <h2
                className="text-4xl sm:text-5xl lg:text-6xl text-white font-normal tracking-tight italic mb-6"
                style={{ fontFamily: "var(--font-instrument)" }}
              >
                Ready to modernize your MFI operations?
              </h2>

              <p className="text-neutral-300 text-base sm:text-lg mb-10 max-w-xl mx-auto leading-relaxed font-sans">
                Get started today with a 14-day free trial. No credit card required.
                Deploy your branches and centers in minutes.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
                <Link
                  href="/app/signup"
                  className="w-full sm:w-auto rounded-full bg-[#166534] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(22,101,52,0.45)] transition-all hover:brightness-110 inline-flex items-center justify-center gap-2"
                >
                  <span>Start Free Trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/app/login"
                  className="w-full sm:w-auto rounded-full bg-white/10 hover:bg-white/15 px-8 py-3.5 text-sm font-medium text-[#f4efe6] transition-colors inline-flex items-center justify-center"
                >
                  Log In
                </Link>
              </div>

              <div className="pt-6 border-t border-white/10 flex items-center justify-center gap-2 text-sm text-neutral-400">
                <Mail className="w-4 h-4 text-[#e6c27a]" />
                <span>Need a custom deployment or question?</span>
                <a
                  href="mailto:support@cylvox.com"
                  className="text-white hover:text-[#e6c27a] underline underline-offset-4 transition-colors font-medium"
                >
                  support@cylvox.com
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <section className="max-w-6xl mx-auto px-4 sm:px-8 pb-16 sm:pb-24">
        <Footer />
      </section>
    </main>
  );
}
