import type { Metadata } from "next";
import React, { Fragment } from "react";
import Link from "next/link";
import {
  Check,
  X,
  Minus,
  ArrowRight,
  ShieldCheck,
  Zap,
  Sparkles,
  HelpCircle,
  Building2,
  Users,
  HardDrive,
  CheckCircle2,
  Lock,
  ChevronRight,
  PhoneCall,
  Clock,
  WifiOff,
} from "lucide-react";

import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { SUBSCRIPTION_PLANS, PlanConfig } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Pricing & Plans | Solida Microfinance Core Banking",
  description:
    "Transparent pricing for microfinance institutions and community lenders. 14-day free trial on Starter, Growth, and Enterprise plans with offline field support.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing & Plans | Solida Microfinance Core Banking",
    description:
      "Transparent pricing for microfinance institutions and community lenders. 14-day free trial on Starter, Growth, and Enterprise plans with offline field support.",
    url: "/pricing",
    siteName: "Solida",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Pricing & Plans | Solida Microfinance Core Banking",
    description:
      "Transparent pricing for microfinance institutions and community lenders. 14-day free trial on Starter, Growth, and Enterprise plans with offline field support.",
  },
};

interface ComparisonRow {
  name: string;
  description?: string;
  starter: boolean | string;
  growth: boolean | string;
  enterprise: boolean | string;
}

interface ComparisonCategory {
  category: string;
  rows: ComparisonRow[];
}

const COMPARISON_CATEGORIES: ComparisonCategory[] = [
  {
    category: "Core Lending & Loan Products",
    rows: [
      {
        name: "Field Officer & Staff Seats",
        description: "Active system users for field collectors, branch managers, and admins",
        starter: "Up to 3 seats",
        growth: "Up to 10 seats",
        enterprise: "Up to 30 seats (expandable)",
      },
      {
        name: "Branch Network Locations",
        description: "Distinct physical branches managed within a single organization",
        starter: "1 Branch",
        growth: "Up to 3 Branches",
        enterprise: "Up to 10 Branches (expandable)",
      },
      {
        name: "Document & Collateral Storage",
        description: "Secure encrypted cloud storage for member KYC, NIC, and loan deeds",
        starter: "500 MB",
        growth: "3 GB",
        enterprise: "10 GB",
      },
      {
        name: "Member KYC & NIC Verification",
        description: "National identity card tracking, borrower profiles, and photo records",
        starter: true,
        growth: true,
        enterprise: true,
      },
      {
        name: "Flexible Loan Product Rules",
        description: "Declining balance, flat interest, weekly, bi-weekly, or monthly terms",
        starter: true,
        growth: true,
        enterprise: true,
      },
      {
        name: "Automated Repayment Schedules",
        description: "Instant amortization table calculation with penal fees and grace periods",
        starter: true,
        growth: true,
        enterprise: true,
      },
      {
        name: "Group Lending Methodology",
        description: "Joint-liability groups, peer guarantor tracking, and center structures",
        starter: false,
        growth: true,
        enterprise: true,
      },
      {
        name: "Loan Restructuring & Refinancing",
        description: "Reschedule overdue facilities, term extensions, and write-off governance",
        starter: false,
        growth: true,
        enterprise: true,
      },
      {
        name: "Member Savings & Deposit Accounts",
        description: "Compulsory & voluntary deposit tracking with automated balance ledgers",
        starter: false,
        growth: false,
        enterprise: true,
      },
      {
        name: "Multi-Tier Approval Thresholds",
        description: "Branch manager and credit committee sign-offs based on loan limits",
        starter: false,
        growth: false,
        enterprise: true,
      },
    ],
  },
  {
    category: "Field Operations & Offline PWA",
    rows: [
      {
        name: "Officer Daily Collection Sheets",
        description: "Scheduled center rosters with expected amounts and real-time tallies",
        starter: true,
        growth: true,
        enterprise: true,
      },
      {
        name: "Mobile-Responsive Field Portal",
        description: "Optimized for Android smartphones and tablets in the field",
        starter: true,
        growth: true,
        enterprise: true,
      },
      {
        name: "Offline-First Field Collections (PWA)",
        description: "Record collections with zero mobile signal; queue and cache securely",
        starter: false,
        growth: true,
        enterprise: true,
      },
      {
        name: "Auto-Sync with Conflict Resolution",
        description: "Instant background upload when connectivity is restored",
        starter: false,
        growth: true,
        enterprise: true,
      },
      {
        name: "GPS Center Coordinates & Routes",
        description: "Geographic mapping of center locations and officer itineraries",
        starter: false,
        growth: true,
        enterprise: true,
      },
      {
        name: "Instant Digital Collection Receipts",
        description: "Generate digital receipts and collection confirmation records",
        starter: false,
        growth: true,
        enterprise: true,
      },
      {
        name: "GPS Officer Check-in Auditing",
        description: "Tamper-proof physical presence logging at meeting centers",
        starter: false,
        growth: false,
        enterprise: true,
      },
      {
        name: "QR Code Borrower Receipt Verification",
        description: "Cryptographic borrower receipt validation to eliminate fraud",
        starter: false,
        growth: false,
        enterprise: true,
      },
    ],
  },
  {
    category: "Accounting & General Ledger",
    rows: [
      {
        name: "Daily Cash Reconciliation",
        description: "Officer end-of-day cash surrender vs recorded collections",
        starter: true,
        growth: true,
        enterprise: true,
      },
      {
        name: "Automated Journal Entries",
        description: "Auto-balanced double-entry debits/credits on all disbursements & repayments",
        starter: true,
        growth: true,
        enterprise: true,
      },
      {
        name: "Chart of Accounts & General Ledger",
        description: "Full double-entry GL with asset, liability, equity, income & expense accounts",
        starter: false,
        growth: true,
        enterprise: true,
      },
      {
        name: "Bank Reconciliations & Cash Flows",
        description: "Match bank statements with field collections and disbursement batches",
        starter: false,
        growth: true,
        enterprise: true,
      },
      {
        name: "Portfolio At Risk (PAR 1/7/30/90) Aging",
        description: "Standard regulatory delinquency aging brackets with provisions",
        starter: false,
        growth: true,
        enterprise: true,
      },
      {
        name: "Repayment Reversal Approval Workflows",
        description: "Two-person rule for accidental entry corrections with full audit trail",
        starter: false,
        growth: true,
        enterprise: true,
      },
      {
        name: "Consolidated Multi-Branch Balance Sheets",
        description: "Head-office rollup of financial positions across all branch locations",
        starter: false,
        growth: false,
        enterprise: true,
      },
      {
        name: "Tamper-Evident Regulatory Audit Logs",
        description: "Immutable transaction logs prepared for central bank inspections",
        starter: false,
        growth: false,
        enterprise: true,
      },
      {
        name: "Custom Financial Report Export (CSV/XLS)",
        description: "One-click exports for external auditors and tax authorities",
        starter: false,
        growth: false,
        enterprise: true,
      },
    ],
  },
  {
    category: "Risk Intelligence & Fraud Detection",
    rows: [
      {
        name: "Role Scoping & Segregation of Duties",
        description: "Distinct permissions for Officer, Cashier, Manager, and Auditor",
        starter: true,
        growth: true,
        enterprise: true,
      },
      {
        name: "Duplicate NIC & Contact Anomaly Flagging",
        description: "Cross-checks new loan applicants against active borrower databases",
        starter: false,
        growth: true,
        enterprise: true,
      },
      {
        name: "Real-time Notification Center",
        description: "Instant in-app alerts on overdue spikes, reversals, or quota breaches",
        starter: false,
        growth: true,
        enterprise: true,
      },
      {
        name: "AI Credit Risk Assessment Engine",
        description: "Machine-learning borrower risk scoring based on historical repayment trends",
        starter: false,
        growth: false,
        enterprise: true,
      },
      {
        name: "Delinquency Early Warning Prediction",
        description: "Algorithmic forecast of at-risk installments before default occurs",
        starter: false,
        growth: false,
        enterprise: true,
      },
      {
        name: "Ghost Loan & Fraud Detection Rules",
        description: "Automated heuristics detecting phantom members and fictitious loans",
        starter: false,
        growth: false,
        enterprise: true,
      },
    ],
  },
  {
    category: "Security, Support & SLA",
    rows: [
      {
        name: "Bank-Grade Encryption (AES-256 / TLS 1.3)",
        description: "Data encrypted both in transit and at rest with isolated tenant partitions",
        starter: true,
        growth: true,
        enterprise: true,
      },
      {
        name: "Automated Cloud Backups",
        description: "Daily automated database snapshots with point-in-time recovery",
        starter: "Daily backup",
        growth: "Daily + on-demand",
        enterprise: "Continuous replication",
      },
      {
        name: "Support Channels",
        description: "Customer service and technical troubleshooting channels",
        starter: "Standard email",
        growth: "Priority email & chat",
        enterprise: "24/7 Phone & dedicated manager",
      },
      {
        name: "Target Response Time",
        description: "Guaranteed SLA for technical incidents",
        starter: "48-hour SLA",
        growth: "24-hour SLA",
        enterprise: "1-hour critical response",
      },
      {
        name: "Uptime Commitment",
        description: "Service availability agreement",
        starter: "99.5% Uptime",
        growth: "99.9% Uptime",
        enterprise: "99.95% Guaranteed SLA",
      },
      {
        name: "Assisted Data Migration & Onboarding",
        description: "Historical borrower, loan ledger, and balance migration assistance",
        starter: "Self-serve import",
        growth: "Guided onboarding",
        enterprise: "White-glove data migration",
      },
    ],
  },
];

const FAQS = [
  {
    question: "How does the 14-day free trial work?",
    answer:
      "Every new institution gets full access to their chosen tier for 14 days without entering payment details. You can onboard officers, create loan products, disburse test loans, and test field collection sheets. If you decide not to continue, your account automatically expires with no charges.",
  },
  {
    question: "Can field officers work without internet?",
    answer:
      "Yes. The Growth and Enterprise plans include our Offline-First Progressive Web App (PWA). Field officers can download their daily collection rosters before leaving the branch, collect installments in remote villages with zero cellular coverage, and automatically sync all transactions once they reconnect.",
  },
  {
    question: "How are monthly fees billed?",
    answer:
      "Subscriptions are billed monthly in Sri Lankan Rupees (LKR). We support direct bank transfers, corporate debit/credit cards, and automated online payment gateways. Invoices with complete tax breakdowns are issued on the first day of each billing cycle.",
  },
  {
    question: "Can we upgrade or downgrade plans anytime?",
    answer:
      "Absolutely. You can scale your tier or purchase additional officer seats as your microfinance institution expands. Upgrades take effect immediately with prorated billing. Downgrades take effect at the beginning of your next monthly billing cycle.",
  },
  {
    question: "What happens to our data if our subscription expires?",
    answer:
      "Your institutional data remains 100% yours. If you pause or cancel your subscription, your data is preserved in read-only mode for 60 days, giving you ample time to export comprehensive customer rosters, historical loan ledgers, and general ledger reports in CSV or Excel format.",
  },
  {
    question: "Is our borrower data secure and isolated?",
    answer:
      "Yes. Solida employs strict multi-tenant schema isolation, meaning your borrower records, NIC photos, and financial ledgers are completely walled off from other institutions. All information is encrypted using AES-256 at rest and TLS 1.3 in transit, in compliance with microfinance regulatory standards.",
  },
];

export default function PricingPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Solida Microfinance Core Banking",
    description:
      "Enterprise-grade core banking, field collections, and double-entry accounting software for microfinance institutions and community lenders.",
    brand: {
      "@type": "Brand",
      name: "Solida",
    },
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "LKR",
      lowPrice: "7500",
      highPrice: "35000",
      offerCount: "3",
      offers: SUBSCRIPTION_PLANS.map((plan) => ({
        "@type": "Offer",
        name: `${plan.name} Plan`,
        price: plan.monthlyPrice.toString(),
        priceCurrency: "LKR",
        priceValidUntil: "2026-12-31",
        availability: "https://schema.org/InStock",
        url: "https://solidamfi.com/pricing",
      })),
    },
  };

  return (
    <div className="relative min-h-screen bg-black text-white selection:bg-[#166534]/40 selection:text-white">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navigation */}
      <Navbar />

      <main className="relative pt-28 pb-20 sm:pt-36 sm:pb-28">
        {/* Glow ambient background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-[#166534]/20 via-[#10261c]/40 to-transparent blur-[120px] rounded-full" />
          <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-[#e6c27a]/5 blur-[140px] rounded-full" />
        </div>

        {/* 1. Header Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/70 border border-emerald-800/60 text-emerald-300 text-xs sm:text-sm font-medium mb-6">
            <Sparkles className="w-3.5 h-3.5 text-[#e6c27a]" />
            <span>14-day free trial on all plans • No credit card required</span>
          </div>

          <h1
            className="text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight text-white mb-6 italic"
            style={{ fontFamily: "var(--font-instrument)" }}
          >
            Predictable, transparent pricing for modern microfinance
          </h1>

          <p className="text-base sm:text-xl text-neutral-300 max-w-3xl mx-auto font-sans leading-relaxed">
            Built specifically for community lenders, microfinance companies, and credit societies.
            All plans include core lending, KYC, and balanced double-entry accounting.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs sm:text-sm text-neutral-400">
            <span className="w-2 h-2 rounded-full bg-[#166534] inline-block" />
            <span>All amounts billed in Sri Lankan Rupees (LKR) monthly. Billed without hidden fees.</span>
          </div>
        </section>

        {/* 2. Pricing Cards Grid */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-28">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {SUBSCRIPTION_PLANS.map((plan: PlanConfig) => {
              const isGrowth = Boolean(plan.highlighted);
              const coreFeatures = plan.featureGroups[0]?.features || [];

              return (
                <div
                  key={plan.id}
                  className={`relative flex flex-col justify-between rounded-3xl p-8 sm:p-10 transition-all duration-300 ${
                    isGrowth
                      ? "bg-gradient-to-b from-[#10261c] to-[#0a1811] border-2 border-[#166534] shadow-[0_0_50px_rgba(22,101,52,0.35)] lg:-translate-y-3 z-10"
                      : "bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  {isGrowth && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-[#166534] text-white text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full border border-emerald-400/30 shadow-md">
                        Recommended Tier
                      </span>
                    </div>
                  )}

                  <div>
                    {/* Top Badges */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-xs font-semibold uppercase tracking-wider text-[#e6c27a] bg-[#e6c27a]/10 px-3 py-1 rounded-full border border-[#e6c27a]/20">
                        {plan.badge || plan.name}
                      </span>
                      <span className="text-xs font-medium text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full">
                        14-Day Free Trial
                      </span>
                    </div>

                    {/* Plan Name & Tagline */}
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {plan.name}
                    </h2>
                    <p className="text-neutral-400 text-sm leading-relaxed mb-6 min-h-[44px]">
                      {plan.tagline}
                    </p>

                    {/* Price Block */}
                    <div className="mb-6 pb-6 border-b border-white/10">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xs text-neutral-400 font-medium uppercase tracking-wider">LKR</span>
                        <span className="text-4xl sm:text-5xl font-black text-white tracking-tight">
                          {plan.monthlyPrice.toLocaleString()}
                        </span>
                        <span className="text-neutral-400 text-sm font-medium">/ month</span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-1">Billed monthly • Cancel anytime</p>

                      {/* Quota Badges */}
                      <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs text-neutral-300">
                        <div className="bg-white/5 border border-white/10 p-2 rounded-xl">
                          <Users className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
                          <span className="font-semibold block text-white">{plan.maxOfficerSeats}</span>
                          <span className="text-[11px] text-neutral-400">Officers</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-2 rounded-xl">
                          <Building2 className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
                          <span className="font-semibold block text-white">{plan.maxBranches}</span>
                          <span className="text-[11px] text-neutral-400">{plan.maxBranches === 1 ? "Branch" : "Branches"}</span>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-2 rounded-xl">
                          <HardDrive className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-400" />
                          <span className="font-semibold block text-white">{plan.storageDisplay}</span>
                          <span className="text-[11px] text-neutral-400">Storage</span>
                        </div>
                      </div>
                    </div>

                    {/* Highlights */}
                    <div className="space-y-3 mb-8">
                      <p className="text-xs font-semibold text-[#e6c27a] uppercase tracking-wider mb-3">
                        What's Included:
                      </p>
                      {coreFeatures.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start gap-3 text-sm text-neutral-300">
                          <div className="mt-0.5 rounded-full bg-[#166534]/50 p-0.5 text-emerald-400 shrink-0 border border-[#166534]">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                          <span className="leading-snug">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4">
                    <Link
                      href="/app/signup"
                      className={`w-full py-4 px-6 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all ${
                        isGrowth
                          ? "bg-[#166534] hover:bg-[#166534]/90 text-white shadow-[0_4px_20px_rgba(22,101,52,0.5)] hover:scale-[1.02]"
                          : "bg-white/10 hover:bg-white/20 text-white border border-white/10 hover:border-white/20"
                      }`}
                    >
                      <span>Start 14-day free trial</span>
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                    <p className="text-center text-[11px] text-neutral-500 mt-2.5">
                      Instant setup • No credit card required
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* 3. Deep Feature Comparison Table */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-28">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#e6c27a] mb-2 inline-block">
              Side-by-Side Breakdown
            </span>
            <h2
              className="text-3xl sm:text-5xl font-normal text-white italic tracking-tight"
              style={{ fontFamily: "var(--font-instrument)" }}
            >
              Compare full plan capabilities
            </h2>
            <p className="mt-3 text-neutral-400 text-sm sm:text-base">
              A comprehensive matrix of core banking features, mobile offline tools, accounting, and compliance.
            </p>
          </div>

          <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/[0.02] shadow-2xl backdrop-blur-sm">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.04]">
                  <th className="py-6 px-6 sm:px-8 text-base font-semibold text-white w-2/5">
                    Feature & Capability
                  </th>
                  <th className="py-6 px-4 text-center text-sm sm:text-base font-bold text-white w-1/5">
                    <span className="block text-white">Starter</span>
                    <span className="text-xs font-normal text-neutral-400">LKR 7,500/mo</span>
                  </th>
                  <th className="py-6 px-4 text-center text-sm sm:text-base font-bold text-emerald-400 w-1/5 bg-[#10261c]/40 border-x border-[#166534]/30">
                    <span className="block text-emerald-300">Growth</span>
                    <span className="text-xs font-normal text-emerald-400/80">LKR 15,000/mo</span>
                  </th>
                  <th className="py-6 px-4 text-center text-sm sm:text-base font-bold text-white w-1/5">
                    <span className="block text-white">Enterprise</span>
                    <span className="text-xs font-normal text-neutral-400">LKR 35,000/mo</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {COMPARISON_CATEGORIES.map((cat, catIdx) => (
                  <React.Fragment key={catIdx}>
                    <tr className="bg-white/[0.06]">
                      <td
                        colSpan={4}
                        className="py-3.5 px-6 sm:px-8 text-xs font-bold uppercase tracking-wider text-[#e6c27a]"
                      >
                        {cat.category}
                      </td>
                    </tr>
                    {cat.rows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="py-4 px-6 sm:px-8 text-sm">
                          <p className="font-medium text-white">{row.name}</p>
                          {row.description && (
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {row.description}
                            </p>
                          )}
                        </td>
                        <td className="py-4 px-4 text-center text-sm">
                          <ComparisonCell value={row.starter} />
                        </td>
                        <td className="py-4 px-4 text-center text-sm bg-[#10261c]/30 border-x border-[#166534]/20">
                          <ComparisonCell value={row.growth} isHighlighted />
                        </td>
                        <td className="py-4 px-4 text-center text-sm">
                          <ComparisonCell value={row.enterprise} />
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Frequently Asked Questions (FAQ) Section */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto mb-28">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-[#e6c27a] mb-2 inline-block">
              Clear Answers
            </span>
            <h2
              className="text-3xl sm:text-5xl font-normal text-white italic tracking-tight"
              style={{ fontFamily: "var(--font-instrument)" }}
            >
              Frequently Asked Questions
            </h2>
            <p className="mt-3 text-neutral-400 text-sm sm:text-base">
              Everything you need to know about Solida billing, data safety, and offline field capability.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-3xl border border-white/10 bg-white/[0.03] p-7 sm:p-8 hover:border-white/20 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3 mb-3">
                    <HelpCircle className="w-5 h-5 text-[#e6c27a] shrink-0 mt-0.5" />
                    <h3 className="font-semibold text-base sm:text-lg text-white">
                      {faq.question}
                    </h3>
                  </div>
                  <p className="text-sm text-neutral-400 leading-relaxed pl-8">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-sm text-neutral-400">
              Have a custom requirement or need higher branch capacity?{" "}
              <Link
                href="mailto:contact@cylvox.com"
                className="text-emerald-400 hover:text-emerald-300 underline font-medium"
              >
                Talk to our core banking team
              </Link>
            </p>
          </div>
        </section>

        {/* 5. Final CTA Banner */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mb-24">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#10261c] via-[#166534] to-[#0c1f17] border border-[#166534]/60 p-8 sm:p-14 text-center shadow-2xl">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-white/10 to-transparent opacity-30" />

            <div className="relative z-10 max-w-3xl mx-auto">
              <span className="text-xs uppercase tracking-widest font-semibold text-[#e6c27a] bg-black/40 px-3.5 py-1.5 rounded-full border border-[#e6c27a]/30 inline-block mb-5">
                Ready to transform your MFI?
              </span>
              <h2
                className="text-3xl sm:text-5xl font-normal text-white italic tracking-tight mb-5"
                style={{ fontFamily: "var(--font-instrument)" }}
              >
                Modernize your field operations today
              </h2>
              <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed mb-8 max-w-xl mx-auto font-sans">
                Join microfinance institutions managing daily collections with zero calculation errors,
                real-time cash reconciliation, and offline-capable field sheets.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/app/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-white text-neutral-900 font-semibold text-sm hover:bg-neutral-100 hover:scale-[1.02] transition-all shadow-lg"
                >
                  <span>Start 14-day free trial</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="https://cylvox.com"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-black/40 text-white font-medium text-sm hover:bg-black/60 border border-white/20 transition-all"
                >
                  <span>Schedule Executive Demo</span>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-xs text-emerald-200/80">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Instant deployment
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  No setup fees
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <div className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-12">
        <Footer />
      </div>
    </div>
  );
}

function ComparisonCell({
  value,
  isHighlighted = false,
}: {
  value: boolean | string;
  isHighlighted?: boolean;
}) {
  if (typeof value === "boolean") {
    if (value) {
      return (
        <div className="inline-flex items-center justify-center rounded-full bg-[#166534]/30 p-1 text-emerald-400 border border-[#166534]/50">
          <Check className="w-4 h-4" />
        </div>
      );
    }
    return (
      <div className="inline-flex items-center justify-center text-neutral-600">
        <Minus className="w-4 h-4" />
      </div>
    );
  }

  return (
    <span
      className={`text-xs sm:text-sm font-semibold ${
        isHighlighted ? "text-emerald-300" : "text-neutral-200"
      }`}
    >
      {value}
    </span>
  );
}
