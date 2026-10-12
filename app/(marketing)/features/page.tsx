import { Metadata } from "next";
import Link from "next/link";
import {
  WifiOff,
  RefreshCw,
  Receipt,
  QrCode,
  SlidersHorizontal,
  CalendarDays,
  Percent,
  CheckCircle2,
  BookOpenCheck,
  Scale,
  FileSpreadsheet,
  ShieldAlert,
  AlertTriangle,
  Fingerprint,
  UserCheck,
  FileCheck2,
  Lock,
  Building2,
  History,
  KeyRound,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  Database,
  DownloadCloud,
  ChevronRight,
  Layers,
  ArrowUpRight,
} from "lucide-react";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "Features & Capabilities | Solida Core Banking for Microfinance",
  description:
    "Explore Solida's end-to-end features: offline center meeting collections, automated loan schedules, double-entry accounting, PAR 1/7/30/90 risk intelligence, and member KYC.",
  alternates: {
    canonical: "/features",
  },
  openGraph: {
    title: "Features & Capabilities | Solida Core Banking for Microfinance",
    description:
      "Explore Solida's end-to-end features: offline center meeting collections, automated loan schedules, double-entry accounting, PAR 1/7/30/90 risk intelligence, and member KYC.",
    url: "/features",
    type: "website",
    siteName: "Solida",
  },
  twitter: {
    card: "summary_large_image",
    title: "Features & Capabilities | Solida Core Banking for Microfinance",
    description:
      "Explore Solida's end-to-end features: offline center meeting collections, automated loan schedules, double-entry accounting, PAR 1/7/30/90 risk intelligence, and member KYC.",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Solida Microfinance Core Banking",
  operatingSystem: "Web, iOS, Android (PWA)",
  applicationCategory: "BusinessApplication, FinancialApplication",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  description:
    "Explore Solida's end-to-end features: offline center meeting collections, automated loan schedules, double-entry accounting, PAR 1/7/30/90 risk intelligence, and member KYC.",
  featureList: [
    "Field Collections & Offline PWA with IndexedDB Sync",
    "Loan Lifecycle & Flexible Products (Flat & Declining Balance)",
    "Automated Double-Entry Accounting & General Ledger",
    "Portfolio At Risk (PAR 1/7/30/90) & Anomaly Intelligence",
    "Member KYC & Encrypted Document Vault",
    "Multi-Branch Governance & Immutable Audit Trail",
  ],
};

export default function FeaturesPage() {
  const technicalPillars = [
    {
      title: "Offline-First PWA",
      desc: "Instant SQLite & IndexedDB caching. Collect repayments deep in rural valleys with zero signal.",
      icon: WifiOff,
    },
    {
      title: "99.9% Cloud Uptime",
      desc: "Distributed microservice core with resilient automated failover and geo-redundant backups.",
      icon: Zap,
    },
    {
      title: "Bank-Grade Encryption",
      desc: "AES-256 at rest, TLS 1.3 in transit, tenant database separation, and SOC-ready audit trails.",
      icon: ShieldCheck,
    },
    {
      title: "Instant Audit & CSV Export",
      desc: "One-click generation of central bank returns, GL summaries, aging matrices, and raw audit dumps.",
      icon: DownloadCloud,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#166534]/40 selection:text-[#e6c27a] flex flex-col">
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />

      <main className="flex-1 w-full pt-28 sm:pt-36">
        {/* HERO SECTION */}
        <section className="relative px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto text-center pb-20 sm:pb-28">
          <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
            <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#166534] to-[#e6c27a] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" />
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#166534]/20 border border-[#166534]/50 text-xs font-semibold uppercase tracking-widest text-[#e6c27a] mb-6">
            <Layers className="w-3.5 h-3.5" />
            <span>Core Banking Infrastructure</span>
          </div>

          <h1
            className="text-4xl sm:text-6xl lg:text-7xl font-normal tracking-tight italic text-white max-w-4xl mx-auto leading-[1.1]"
            style={{ fontFamily: "var(--font-instrument)" }}
          >
            Built for last-mile lending, from village centers to boardrooms
          </h1>

          <p className="mt-6 text-neutral-300 text-base sm:text-xl max-w-3xl mx-auto leading-relaxed font-sans font-light">
            Solida unifies field operations, automated amortizations, double-entry accounting,
            and real-time regulatory compliance into one cohesive platform designed specifically
            for microfinance institutions and community lenders.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/app/signup"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[#166534] hover:bg-[#166534]/90 px-7 py-3 text-sm font-semibold text-white shadow-[0_0_30px_rgba(22,101,52,0.4)] transition-all hover:scale-105"
            >
              <span>Start 14-Day Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#module-collections"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 text-sm font-medium text-neutral-300 hover:text-white transition-all"
            >
              <span>Explore All Modules</span>
              <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </section>

        {/* TECHNICAL HIGHLIGHTS BAR */}
        <section className="border-y border-white/10 bg-white/[0.02] backdrop-blur-sm py-8 sm:py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
              {technicalPillars.map((pillar, idx) => {
                const Icon = pillar.icon;
                return (
                  <div key={idx} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#166534]/25 border border-[#166534]/50 flex items-center justify-center shrink-0 text-[#e6c27a]">
                      <Icon className="w-5 h-5 text-[#f4efe6]" />
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-white tracking-tight mb-1">
                        {pillar.title}
                      </h2>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        {pillar.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 6 IN-DEPTH CAPABILITY MODULES */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 space-y-28 sm:space-y-40">
          {/* MODULE 1: Field Collections & Offline PWA */}
          <section id="module-collections" className="scroll-mt-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#166534]/25 border border-[#166534]/50 text-xs font-semibold uppercase tracking-wider text-[#e6c27a]">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Module 01 &bull; Last-Mile Mobility</span>
                </div>
                <h2
                  className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight italic text-white"
                  style={{ fontFamily: "var(--font-instrument)" }}
                >
                  Field Collections & Offline PWA
                </h2>
                <p className="text-neutral-300 text-base leading-relaxed">
                  Field officers operate in remote villages where cellular coverage is intermittent or nonexistent.
                  Solida’s Progressive Web Application (PWA) delivers an offline-first architecture powered by
                  IndexedDB and local state isolation. Loan officers pull their weekly center meeting manifests
                  before departing, record cash collections offline with biometric or signature confirmation, and
                  instantly sync upon cell connection with full idempotency.
                </p>

                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Key Specifications & Capabilities
                  </h3>
                  <ul className="space-y-2.5 text-sm text-neutral-300">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Center Meeting Manifests:</strong> Pre-cached rosters of borrower groups with expected weekly installments and overdue arrears.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Conflict-Free Offline Sync:</strong> Transaction batch queue with timestamped deterministic hashing to prevent duplicate collections.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Automated EOD Cash Reconciliation:</strong> Field cash tally cross-checked against vault deposits and bank slips before day close.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Digital Receipts & QR Proof:</strong> Instant SMS receipts and tamper-evident QR code issuance on portable thermal printers.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Mockup Card */}
              <div className="lg:col-span-6">
                <div className="bg-[#10261c] border border-[#166534]/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(22,101,52,0.25)] relative overflow-hidden">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                    <div>
                      <div className="text-xs text-neutral-400 font-mono">CENTER #014 &bull; TUESDAY 09:30 AM</div>
                      <div className="text-base font-semibold text-white">Anuradhapura North - Samurdhi Group 3</div>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-medium">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      Offline Mode (12 Queued)
                    </span>
                  </div>

                  {/* Roster Items */}
                  <div className="space-y-3 mb-6">
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#166534]/40 flex items-center justify-center text-xs font-bold text-[#e6c27a]">
                          KN
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Kusumawathi Navaratne</div>
                          <div className="text-xs text-neutral-400">Loan #LN-4802 &bull; Wk 14/24</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-emerald-400 font-mono">+$25.00</div>
                        <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Collected &bull; Cash</span>
                      </div>
                    </div>

                    <div className="bg-black/40 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#166534]/40 flex items-center justify-center text-xs font-bold text-[#e6c27a]">
                          PS
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Priyantha Silva</div>
                          <div className="text-xs text-neutral-400">Loan #LN-4819 &bull; Wk 08/24</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-emerald-400 font-mono">+$32.50</div>
                        <span className="text-[11px] text-neutral-400 uppercase tracking-wider">Collected &bull; Cash</span>
                      </div>
                    </div>

                    <div className="bg-black/40 border border-amber-500/20 rounded-2xl p-3.5 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-xs font-bold text-amber-300">
                          DM
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">Dilani Manike</div>
                          <div className="text-xs text-neutral-400">Loan #LN-4903 &bull; Wk 02/24</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-amber-300 font-mono">Pending</div>
                        <span className="text-[11px] text-neutral-400">Arrears: $18.00</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer EOD status */}
                  <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-neutral-300">
                    <span className="flex items-center gap-1.5">
                      <Receipt className="w-4 h-4 text-[#e6c27a]" />
                      Total Cash In Bag: <strong className="text-white font-mono">$485.00</strong>
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <QrCode className="w-3.5 h-3.5" />
                      QR Verified
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* MODULE 2: Loan Lifecycle & Flexible Products */}
          <section id="module-loans" className="scroll-mt-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Mockup Card */}
              <div className="lg:col-span-6 order-2 lg:order-1">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 relative">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                    <div>
                      <div className="text-xs text-[#e6c27a] font-mono uppercase tracking-wider">LOAN PRODUCT CONFIG</div>
                      <div className="text-base font-semibold text-white">Agri-Micro Capital (24 Weeks)</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#166534]/50 border border-[#166534] text-xs font-semibold text-emerald-300">
                      Active Product
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-black/50 border border-white/5 rounded-2xl p-3">
                      <div className="text-[11px] text-neutral-400">Interest Calculation</div>
                      <div className="text-sm font-semibold text-white mt-0.5">Declining Balance</div>
                      <div className="text-[11px] text-[#e6c27a]">Annual 18.0% APR</div>
                    </div>
                    <div className="bg-black/50 border border-white/5 rounded-2xl p-3">
                      <div className="text-[11px] text-neutral-400">Repayment Cadence</div>
                      <div className="text-sm font-semibold text-white mt-0.5">Weekly Center Installment</div>
                      <div className="text-[11px] text-neutral-400">2 Weeks Grace Period</div>
                    </div>
                  </div>

                  {/* Amortization schedule mini table */}
                  <div className="bg-black/50 border border-white/5 rounded-2xl p-4 space-y-2.5 text-xs font-mono">
                    <div className="flex justify-between text-neutral-400 border-b border-white/10 pb-1.5 font-sans">
                      <span>#</span>
                      <span>Principal</span>
                      <span>Interest</span>
                      <span>Total Due</span>
                      <span>Remaining</span>
                    </div>
                    <div className="flex justify-between text-neutral-300">
                      <span className="text-emerald-400 font-bold">W01</span>
                      <span>$38.45</span>
                      <span>$6.55</span>
                      <span className="text-white font-semibold">$45.00</span>
                      <span>$961.55</span>
                    </div>
                    <div className="flex justify-between text-neutral-300">
                      <span className="text-emerald-400 font-bold">W02</span>
                      <span>$38.70</span>
                      <span>$6.30</span>
                      <span className="text-white font-semibold">$45.00</span>
                      <span>$922.85</span>
                    </div>
                    <div className="flex justify-between text-neutral-300">
                      <span className="text-emerald-400 font-bold">W03</span>
                      <span>$38.96</span>
                      <span>$6.04</span>
                      <span className="text-white font-semibold">$45.00</span>
                      <span>$883.89</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
                    <span>Actions: Disburse &bull; Restructure &bull; Refinance</span>
                    <span className="text-emerald-400 font-medium">Automatic Penalties: Enabled</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#166534]/25 border border-[#166534]/50 text-xs font-semibold uppercase tracking-wider text-[#e6c27a]">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Module 02 &bull; Product Flexibility</span>
                </div>
                <h2
                  className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight italic text-white"
                  style={{ fontFamily: "var(--font-instrument)" }}
                >
                  Loan Lifecycle & Flexible Products
                </h2>
                <p className="text-neutral-300 text-base leading-relaxed">
                  Every borrower segment has different cash cycles. Agricultural borrowers need seasonal moratoriums,
                  while micro-retailers demand strict weekly repayments. Solida gives product architects unlimited
                  granularity to configure flat vs declining interest schedules, upfront processing deductions,
                  and penal fee formulas without writing a line of code.
                </p>

                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Key Specifications & Capabilities
                  </h3>
                  <ul className="space-y-2.5 text-sm text-neutral-300">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Dual Interest Computation:</strong> Support for Flat interest, Declining balance (equal installments), and Bullet harvest settlements.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>State Machine Workflow:</strong> Strict progression: Application &rarr; Credit Committee Review &rarr; Approval &rarr; Disbursement &rarr; Active &rarr; Closed.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Restructuring & Write-offs:</strong> Formal audit-governed workflows for loan top-ups, tenure extensions, and bad-debt provisioning.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Grace Periods & Penal Fees:</strong> Flexible principal/interest holiday configurations with automated overdue penalty tiers.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* MODULE 3: Automated Double-Entry Accounting */}
          <section id="module-accounting" className="scroll-mt-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#166534]/25 border border-[#166534]/50 text-xs font-semibold uppercase tracking-wider text-[#e6c27a]">
                  <BookOpenCheck className="w-3.5 h-3.5" />
                  <span>Module 03 &bull; Financial Integrity</span>
                </div>
                <h2
                  className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight italic text-white"
                  style={{ fontFamily: "var(--font-instrument)" }}
                >
                  Automated Double-Entry Accounting
                </h2>
                <p className="text-neutral-300 text-base leading-relaxed">
                  Never manually post a journal entry again. In Solida, loan disbursements, weekly repayments,
                  processing fee deductions, and penal charges automatically trigger balanced double-entry
                  journal vouchers in real time. Your general ledger, balance sheet, and trial balance update
                  instantly with zero human bookkeeping errors.
                </p>

                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Key Specifications & Capabilities
                  </h3>
                  <ul className="space-y-2.5 text-sm text-neutral-300">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Real-Time General Ledger:</strong> Native double-entry chart of accounts mapped directly to IFRS and microfinance regulatory standards.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Event-Driven Journal Vouchers:</strong> Auto-posting upon cash collection: Debits Cash in Hand, Credits Principal Outstanding and Interest Income.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Always-Balanced Trial Balance:</strong> Atomic database transactions guarantee that debits strictly equal credits across every branch.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Financial Statements On Demand:</strong> Generate real-time P&L, balance sheets, and cash flow forecasts filtered by branch or date range.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Mockup Card */}
              <div className="lg:col-span-6">
                <div className="bg-[#10261c] border border-[#166534]/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(22,101,52,0.25)]">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                    <div>
                      <div className="text-xs text-neutral-400 font-mono">AUTOMATED JOURNAL VOUCHER #JV-2026-9042</div>
                      <div className="text-base font-semibold text-white">Center Repayment &bull; Group Collection</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-medium flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5" />
                      Balanced (Net $0.00)
                    </span>
                  </div>

                  {/* Journal lines */}
                  <div className="bg-black/60 border border-white/10 rounded-2xl overflow-hidden mb-5">
                    <div className="grid grid-cols-12 text-[11px] font-mono text-neutral-400 bg-white/5 p-3 border-b border-white/10">
                      <span className="col-span-6">ACCOUNT</span>
                      <span className="col-span-3 text-right">DEBIT</span>
                      <span className="col-span-3 text-right">CREDIT</span>
                    </div>
                    <div className="p-3 space-y-2.5 text-xs font-mono">
                      <div className="grid grid-cols-12 text-neutral-200">
                        <span className="col-span-6 text-white">1010 &bull; Cash in Hand (Field Vault)</span>
                        <span className="col-span-3 text-right text-emerald-400 font-semibold">$350.00</span>
                        <span className="col-span-3 text-right text-neutral-500">-</span>
                      </div>
                      <div className="grid grid-cols-12 text-neutral-200">
                        <span className="col-span-6 text-white">1200 &bull; Loans Receivable (Micro Term)</span>
                        <span className="col-span-3 text-right text-neutral-500">-</span>
                        <span className="col-span-3 text-right text-amber-300 font-semibold">$295.40</span>
                      </div>
                      <div className="grid grid-cols-12 text-neutral-200">
                        <span className="col-span-6 text-white">4010 &bull; Interest Income (Micro)</span>
                        <span className="col-span-3 text-right text-neutral-500">-</span>
                        <span className="col-span-3 text-right text-amber-300 font-semibold">$54.60</span>
                      </div>
                    </div>
                    <div className="bg-white/5 p-3 border-t border-white/10 grid grid-cols-12 text-xs font-mono font-bold text-white">
                      <span className="col-span-6">TOTALS</span>
                      <span className="col-span-3 text-right text-emerald-400">$350.00</span>
                      <span className="col-span-3 text-right text-emerald-400">$350.00</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Chart of Accounts: Tier-1 MFI Standard</span>
                    <span className="text-[#e6c27a]">Status: Posted to Ledger</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* MODULE 4: Portfolio At Risk (PAR) & Anomaly Intelligence */}
          <section id="module-par" className="scroll-mt-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Mockup Card */}
              <div className="lg:col-span-6 order-2 lg:order-1">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 relative">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                    <div>
                      <div className="text-xs text-[#e6c27a] font-mono">RISK SURVEILLANCE &bull; LIVE FEED</div>
                      <div className="text-base font-semibold text-white">Delinquency & Exposure Matrix</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-mono font-medium flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      1 Anomaly Flagged
                    </span>
                  </div>

                  {/* PAR Aging Badges */}
                  <div className="grid grid-cols-4 gap-2.5 mb-6 text-center font-mono">
                    <div className="bg-black/50 border border-white/10 rounded-2xl p-2.5">
                      <div className="text-[10px] text-neutral-400">PAR 1</div>
                      <div className="text-base font-bold text-emerald-400 mt-0.5">1.4%</div>
                      <div className="text-[9px] text-neutral-500">1-6 Days</div>
                    </div>
                    <div className="bg-black/50 border border-white/10 rounded-2xl p-2.5">
                      <div className="text-[10px] text-neutral-400">PAR 7</div>
                      <div className="text-base font-bold text-emerald-400 mt-0.5">2.1%</div>
                      <div className="text-[9px] text-neutral-500">7-29 Days</div>
                    </div>
                    <div className="bg-black/50 border border-white/10 rounded-2xl p-2.5">
                      <div className="text-[10px] text-neutral-400">PAR 30</div>
                      <div className="text-base font-bold text-amber-400 mt-0.5">0.9%</div>
                      <div className="text-[9px] text-neutral-500">30-89 Days</div>
                    </div>
                    <div className="bg-black/50 border border-white/10 rounded-2xl p-2.5">
                      <div className="text-[10px] text-neutral-400">PAR 90</div>
                      <div className="text-base font-bold text-emerald-400 mt-0.5">0.3%</div>
                      <div className="text-[9px] text-neutral-500">NPL 90+</div>
                    </div>
                  </div>

                  {/* Anomaly Alert Box */}
                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-semibold text-amber-300">Duplicate NIC Cross-Guarantor Warning</div>
                        <p className="text-xs text-neutral-300 mt-1 leading-relaxed">
                          Borrower NIC <span className="font-mono text-white">884920194V</span> is already registered as Primary Debtor in Center #08 with active balance $680.00.
                        </p>
                        <div className="mt-2.5 flex items-center gap-3 text-[11px]">
                          <span className="text-amber-400 font-medium">Risk Score: Moderate</span>
                          <span className="text-neutral-400">&bull; Exposure Block Triggered</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400">
                    <span>Automated SMS Reminders: On (Day -1, Day +1)</span>
                    <span className="text-emerald-400 font-mono">Portfolio Health: 97.6%</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#166534]/25 border border-[#166534]/50 text-xs font-semibold uppercase tracking-wider text-[#e6c27a]">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Module 04 &bull; Risk Surveillance</span>
                </div>
                <h2
                  className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight italic text-white"
                  style={{ fontFamily: "var(--font-instrument)" }}
                >
                  Portfolio At Risk & Anomaly Intelligence
                </h2>
                <p className="text-neutral-300 text-base leading-relaxed">
                  In microfinance, late detection of delinquency is fatal. Solida gives executives instant
                  visibility into aging buckets (PAR 1, PAR 7, PAR 30, and PAR 90) updated after every center meeting.
                  Under the hood, anomaly engines flag duplicate identity numbers (NIC/passports), repeated phone numbers,
                  and cross-guarantor debt concentration before new capital leaves the branch.
                </p>

                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Key Specifications & Capabilities
                  </h3>
                  <ul className="space-y-2.5 text-sm text-neutral-300">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Granular PAR Aging:</strong> Continuous calculation of PAR 1, 7, 30, and 90 ratios grouped by branch, loan product, or loan officer.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Duplicate Identity Shield:</strong> Real-time cross-branch checks prevent borrowers from taking multiple simultaneous loans under variations of NIC.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Guarantor Exposure Mapping:</strong> Automatically limit how many active loans a single member can guarantee to protect group solidarity.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Automated Early Warning Signals:</strong> Predictive alerts trigger when borrower groups miss consecutive center attendance meetings.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* MODULE 5: Member KYC & Encrypted Document Vault */}
          <section id="module-kyc" className="scroll-mt-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#166534]/25 border border-[#166534]/50 text-xs font-semibold uppercase tracking-wider text-[#e6c27a]">
                  <Fingerprint className="w-3.5 h-3.5" />
                  <span>Module 05 &bull; Identity & Verification</span>
                </div>
                <h2
                  className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight italic text-white"
                  style={{ fontFamily: "var(--font-instrument)" }}
                >
                  Member KYC & Encrypted Document Vault
                </h2>
                <p className="text-neutral-300 text-base leading-relaxed">
                  Eliminate lost paper files and non-compliant onboarding. Solida digitizes your entire borrower registry
                  with in-field photo capture, National Identity Card (NIC) verification, biometric profiles, and
                  guarantor cross-referencing. All signed promissory notes and documents are encrypted and stored
                  using short-lived secure presigned cloud URLs.
                </p>

                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Key Specifications & Capabilities
                  </h3>
                  <ul className="space-y-2.5 text-sm text-neutral-300">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Digital Member Registry:</strong> Comprehensive profiles covering family dependants, residence proofs, credit history, and center membership.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Live In-Field Photo Capture:</strong> Capture borrower facial portraits, residence photos, and shop assets directly from mobile cameras.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Guarantor Cross-Referencing:</strong> Verify mutual guarantor relationships and guarantee caps across multiple center branches.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Encrypted Cloud Storage:</strong> AWS S3 vault with AES-256 server-side encryption, accessible only via authenticated expiring presigned tokens.</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Mockup Card */}
              <div className="lg:col-span-6">
                <div className="bg-[#10261c] border border-[#166534]/60 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(22,101,52,0.25)]">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                    <div>
                      <div className="text-xs text-neutral-400 font-mono">MEMBER PROFILE #MBR-8302</div>
                      <div className="text-base font-semibold text-white">Champa Kumari &bull; Center 04</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-medium flex items-center gap-1">
                      <UserCheck className="w-3.5 h-3.5" />
                      KYC Approved
                    </span>
                  </div>

                  {/* Profile info & document list */}
                  <div className="bg-black/50 border border-white/10 rounded-2xl p-4 mb-5 space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-sm font-bold text-[#e6c27a]">
                        CK
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-white">National ID: 198264901248</div>
                        <div className="text-xs text-neutral-400">Village: Medawachchiya &bull; Phone: +94 77 248 1029</div>
                        <div className="text-[11px] text-emerald-400 mt-0.5">Biometrics & Facial Match: 99.4% Verified</div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 space-y-2 text-xs">
                      <div className="flex items-center justify-between bg-black/60 p-2.5 rounded-xl border border-white/5">
                        <span className="flex items-center gap-2 text-neutral-300">
                          <FileCheck2 className="w-4 h-4 text-[#e6c27a]" />
                          NIC_Front_Back_Scan.pdf
                        </span>
                        <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Encrypted S3
                        </span>
                      </div>
                      <div className="flex items-center justify-between bg-black/60 p-2.5 rounded-xl border border-white/5">
                        <span className="flex items-center gap-2 text-neutral-300">
                          <FileCheck2 className="w-4 h-4 text-[#e6c27a]" />
                          Signed_Promissory_Agreement.pdf
                        </span>
                        <span className="text-[11px] text-emerald-400 font-mono flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Encrypted S3
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span>Guarantor: Sunethra Bandara (Verified)</span>
                    <span className="text-[#e6c27a]">Audit Trail: Hash Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* MODULE 6: Multi-Branch Governance & Immutable Audit Trail */}
          <section id="module-governance" className="scroll-mt-24">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Mockup Card */}
              <div className="lg:col-span-6 order-2 lg:order-1">
                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 relative">
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-5">
                    <div>
                      <div className="text-xs text-[#e6c27a] font-mono">GOVERNANCE ENGINE &bull; IMMUTABLE LOGS</div>
                      <div className="text-base font-semibold text-white">Institutional Multi-Tenant Audit Log</div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-mono font-medium flex items-center gap-1">
                      <KeyRound className="w-3.5 h-3.5" />
                      RBAC Enforced
                    </span>
                  </div>

                  {/* Audit Event Entries */}
                  <div className="space-y-2.5 mb-5 font-mono text-xs">
                    <div className="bg-black/60 border border-white/5 rounded-2xl p-3">
                      <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                        <span>OCT 12, 10:42 AM &bull; Matara Branch</span>
                        <span className="text-emerald-400">AUTH: SUCCESS</span>
                      </div>
                      <div className="text-white font-medium mt-1">Disbursement Approval: $1,200.00 to LN-4912</div>
                      <div className="text-neutral-400 text-[11px] mt-0.5">Role: Branch Manager &bull; IP: 192.168.10.42</div>
                    </div>

                    <div className="bg-black/60 border border-red-500/20 rounded-2xl p-3">
                      <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                        <span>OCT 12, 09:15 AM &bull; Galle Branch</span>
                        <span className="text-red-400">AUTH: POLICY REJECT</span>
                      </div>
                      <div className="text-white font-medium mt-1">Attempted Loan Reschedule Without Committee Signature</div>
                      <div className="text-neutral-400 text-[11px] mt-0.5">Role: Field Officer &bull; Action Blocked by Engine</div>
                    </div>

                    <div className="bg-black/60 border border-white/5 rounded-2xl p-3">
                      <div className="flex items-center justify-between text-neutral-400 text-[11px]">
                        <span>OCT 12, 08:30 AM &bull; Head Office</span>
                        <span className="text-blue-400">EXPORT</span>
                      </div>
                      <div className="text-white font-medium mt-1">Generated Central Bank Regulatory Return (Form MFI-4)</div>
                      <div className="text-neutral-400 text-[11px] mt-0.5">Role: Chief Accountant &bull; Format: CSV / Signed PDF</div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-neutral-400 font-sans">
                    <span>Tenant Isolation: Schema-Separated</span>
                    <span className="text-emerald-400 font-medium">Tamper Proof: SHA-256 Ledger</span>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-6 space-y-6 order-1 lg:order-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#166534]/25 border border-[#166534]/50 text-xs font-semibold uppercase tracking-wider text-[#e6c27a]">
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Module 06 &bull; Multi-Branch Governance</span>
                </div>
                <h2
                  className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight italic text-white"
                  style={{ fontFamily: "var(--font-instrument)" }}
                >
                  Multi-Branch Governance & Audit Trail
                </h2>
                <p className="text-neutral-300 text-base leading-relaxed">
                  Scale from a single branch to dozens across provinces without losing oversight.
                  Solida’s hierarchical multi-branch model empowers Head Office executives with unified
                  real-time metrics while maintaining strict data separation between branches. Role-Based
                  Access Control (RBAC) enforces distinct segregation of duties between loan originators,
                  approvers, and accountants.
                </p>

                <div className="space-y-3 pt-2">
                  <h3 className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
                    Key Specifications & Capabilities
                  </h3>
                  <ul className="space-y-2.5 text-sm text-neutral-300">
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Hierarchical Organization:</strong> Structure regional offices, branches, centers, and borrower solidarity groups with customizable assignment rules.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Segregation of Duties (RBAC):</strong> Discrete roles for Head Office Admin, Branch Manager, Credit Officer, and Auditor prevent collusion.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Immutable Financial Audit Log:</strong> Every credit disbursement, repayment adjustment, or status change is cryptographically recorded.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-[#e6c27a] shrink-0 mt-0.5" />
                      <span><strong>Strict Tenant Isolation:</strong> Zero cross-institution data bleed with tenant scoped database queries and strict schema boundaries.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* FINAL CTA BANNER */}
        <section className="py-20 sm:py-28 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#10261c] to-black border border-[#166534]/60 p-8 sm:p-14 lg:p-20 text-center shadow-[0_0_60px_rgba(22,101,52,0.3)]">
            <div className="absolute top-0 right-1/4 -mt-12 w-96 h-96 bg-[#166534]/30 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#166534]/30 border border-[#166534]/60 text-xs font-semibold uppercase tracking-wider text-[#e6c27a] mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Zero Risk Deployment &bull; 14-Day Free Trial</span>
              </div>

              <h2
                className="text-4xl sm:text-5xl lg:text-6xl font-normal tracking-tight italic text-white mb-6 leading-tight"
                style={{ fontFamily: "var(--font-instrument)" }}
              >
                Ready to elevate your microfinance operations?
              </h2>

              <p className="text-neutral-300 text-base sm:text-lg mb-10 leading-relaxed font-sans max-w-2xl mx-auto">
                Join forward-thinking community banks and microfinance institutions modernizing their field operations,
                loan books, and accounting with Solida. Setup takes minutes.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/app/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-[#166534] hover:bg-[#166534]/90 px-8 py-4 text-base font-semibold text-white shadow-[0_0_30px_rgba(22,101,52,0.5)] transition-all hover:scale-105"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/#pricing"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white/10 hover:bg-white/15 px-8 py-4 text-base font-medium text-neutral-200 hover:text-white transition-colors"
                >
                  <span>View Pricing Plans</span>
                </Link>
              </div>

              <div className="mt-8 text-xs text-neutral-400">
                No credit card required &bull; Immediate sandbox access &bull; Cancel anytime
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
          <Footer />
        </section>
      </main>
    </div>
  );
}
