import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Shield, Lock, Eye, FileText, Server, UserCheck } from "lucide-react";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "Privacy Policy | Solida Microfinance Core Banking",
  description: "Learn how Solida protects institutional, officer, and borrower data with multi-tenant encryption, strict access controls, and zero data selling.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | Solida Microfinance Core Banking",
    description: "Learn how Solida protects institutional, officer, and borrower data with multi-tenant encryption, strict access controls, and zero data selling.",
    url: "/privacy",
    type: "website",
  },
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "October 12, 2026";

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-24 w-full">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-neutral-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>

        {/* Header */}
        <div className="border-b border-white/10 pb-8 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#166534]/30 border border-[#166534]/50 text-xs font-semibold uppercase tracking-wider text-[#e6c27a] mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>Institutional Data Protection</span>
          </div>
          <h1
            className="text-4xl sm:text-5xl font-normal tracking-tight italic mb-3 text-white"
            style={{ fontFamily: "var(--font-instrument)" }}
          >
            Privacy Policy
          </h1>
          <p className="text-sm text-neutral-400">
            Effective Date: {lastUpdated} &bull; Version 2.1
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-10 text-neutral-300 leading-relaxed font-sans text-[15px]">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Eye className="w-5 h-5 text-[#e6c27a]" />
              1. Overview & Data Architecture
            </h2>
            <p>
              Solida (&quot;the Platform&quot;), operated by Cylvox (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), provides multi-tenant core banking, loan management, and field collection services designed for Microfinance Institutions, Community Lenders, and Microcredit Cooperatives (&quot;Institutions&quot; or &quot;Customers&quot;).
            </p>
            <p>
              We act as a <strong>Data Processor</strong> on behalf of our customer institutions. Your institution remains the sole <strong>Data Controller</strong> of all member, borrower, guarantor, and loan transactional data entered into Solida.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#e6c27a]" />
              2. Information We Collect
            </h2>
            <div className="space-y-3 pl-4 border-l border-white/10">
              <p>
                <strong>Account & Institutional Data:</strong> Institution name, business registration, administrator contact details, billing claims, and employee credentials (emails, hashed passwords, roles, branch assignments).
              </p>
              <p>
                <strong>Field Operational Data:</strong> GPS check-in coordinates recorded during center meetings for anti-fraud reconciliation, collection timestamps, and offline synchronization queues.
              </p>
              <p>
                <strong>Borrower & Loan Records (Processed on Your Behalf):</strong> Member names, National Identity Card (NIC) numbers, phone numbers, loan schedules, repayment histories, collateral photos, and KYC identity documents stored securely via encrypted AWS S3 presigned URLs.
              </p>
              <p>
                <strong>Audit & Security Logs:</strong> IP addresses, login timestamps, failed attempt tallies for rate limiting, and immutable financial audit trails of all ledger adjustments and repayment reversals.
              </p>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Lock className="w-5 h-5 text-[#e6c27a]" />
              3. Multi-Tenant Isolation & Security
            </h2>
            <p>
              We implement architectural barriers to ensure absolute tenant data segregation:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Data Scoping:</strong> All database queries are executed with automated organizational scoping (<code className="text-[#e6c27a] bg-white/5 px-1.5 py-0.5 rounded">withOrgScope</code> and Data Access Layer enforcement), preventing cross-tenant data leakage.
              </li>
              <li>
                <strong>Document Protection:</strong> Borrower KYC documents are stored in private cloud object storage with time-limited (5-minute) signed access URLs. No public bucket access is permitted.
              </li>
              <li>
                <strong>Transport & Rest Encryption:</strong> All network communication is strictly enforced with TLS 1.3, Strict-Transport-Security (HSTS), and database storage encryption at rest.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Server className="w-5 h-5 text-[#e6c27a]" />
              4. Data Retention, Portability & Purging
            </h2>
            <p>
              <strong>Data Ownership:</strong> You own your institution&apos;s data at all times. Administrators can export complete datasets in CSV format (members, loans, repayments, accounting ledger) at any time through the Billing & Data settings.
            </p>
            <p>
              <strong>Trial Expiration & Purge Policy:</strong> Inactive evaluation accounts whose free trial has ended are subject to a 30-day grace period. After this window, expired trial organizations and uploaded documents are permanently deleted via automated cryptographic purging to ensure borrower data is not retained indefinitely.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#e6c27a]" />
              5. No Sale of Borrower or Financial Data
            </h2>
            <p>
              We <strong>never sell, rent, monetize, or broker</strong> customer, officer, or borrower personal information to any credit bureau, third-party advertiser, or financial institution. Your data is strictly used to deliver core operational software.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight">
              6. Contact Us
            </h2>
            <p>
              If your institution has privacy questions, security audit inquiries, or requires an enterprise Data Processing Agreement (DPA), please contact our security team:
            </p>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sm">
              <p className="font-semibold text-white">Cylvox Security & Data Governance</p>
              <p className="text-neutral-400 mt-1">Email: <a href="mailto:support@cylvox.com" className="text-[#e6c27a] hover:underline">support@cylvox.com</a></p>
              <p className="text-neutral-400">Website: <a href="https://solida.cylvox.com" className="text-[#e6c27a] hover:underline">solida.cylvox.com</a></p>
            </div>
          </section>
        </div>
      </main>

      <div className="max-w-6xl mx-auto px-4 sm:px-8 pb-16 w-full">
        <Footer />
      </div>
    </div>
  );
}
