import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Scale, CheckCircle2, AlertTriangle, ShieldCheck, DollarSign, Database } from "lucide-react";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";

export const metadata: Metadata = {
  title: "Terms of Service | Solida Microfinance Core Banking",
  description: "Terms of service governing the usage of Solida microfinance platform, offline field synchronization, subscription quotas, and operational SLA.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service | Solida Microfinance Core Banking",
    description: "Terms of service governing the usage of Solida microfinance platform, offline field synchronization, subscription quotas, and operational SLA.",
    url: "/terms",
    type: "website",
  },
};

export default function TermsOfServicePage() {
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
            <Scale className="w-3.5 h-3.5" />
            <span>Service Agreement</span>
          </div>
          <h1
            className="text-4xl sm:text-5xl font-normal tracking-tight italic mb-3 text-white"
            style={{ fontFamily: "var(--font-instrument)" }}
          >
            Terms of Service
          </h1>
          <p className="text-sm text-neutral-400">
            Last Modified: {lastUpdated} &bull; Enterprise Version 2.1
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-10 text-neutral-300 leading-relaxed font-sans text-[15px]">
          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#e6c27a]" />
              1. Acceptance of Terms
            </h2>
            <p>
              By registering an institutional account, accessing our cloud banking software, or using the Solida Offline Field Mobile Application (collectively, &quot;the Service&quot;), your microfinance institution or lending enterprise agrees to be legally bound by these Terms of Service.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#e6c27a]" />
              2. Permitted Use & Institutional Responsibility
            </h2>
            <p>
              The Service is provided exclusively to legitimate microcredit organizations, cooperatives, and community lending practitioners. You agree that:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                You will comply with all regional microfinance lending regulations, anti-money laundering (AML), and customer KYC mandates applicable to your jurisdiction.
              </li>
              <li>
                You will maintain secure administration credentials and immediately revoke access for former staff, officers, or branch personnel through the Team Management console.
              </li>
              <li>
                You are solely responsible for ensuring the accuracy of all interest calculations, repayment terms, and disbursement parameters configured in your custom loan products.
              </li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#e6c27a]" />
              3. Subscription Plans, Quotas & Offline Billing
            </h2>
            <p>
              <strong>Subscription Quotas:</strong> Each tier (Starter, Growth, Enterprise) provides defined officer seats, branch allocations, and document storage limits. Exceeding tier thresholds requires an upgrade.
            </p>
            <p>
              <strong>Payment Claims:</strong> For institutions utilizing offline bank transfers or direct corporate deposits, subscription renewal is activated upon administrative review and verification of submitted payment claims.
            </p>
            <p>
              <strong>Grace Period & Service Suspension:</strong> Accounts with expired subscriptions are placed into a restricted status where core operational writes are suspended while historical financial records remain exportable.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <Database className="w-5 h-5 text-[#e6c27a]" />
              4. Institutional Data Ownership & Export
            </h2>
            <p>
              You retain 100% intellectual property and ownership rights to your member roster, loan ledger, chart of accounts, and field transaction logs. Solida provides self-service CSV data export at any time to guarantee zero vendor lock-in.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-[#e6c27a]" />
              5. Service Level & Offline Operation
            </h2>
            <p>
              While Solida maintains high-availability cloud infrastructure with automated database backups, our Progressive Web Application (PWA) is engineered for offline resilience. In the event of telecommunication disruption, field officers may record collections locally. The institution is responsible for performing periodic synchronization upon returning to active cellular coverage.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight">
              6. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable law, Cylvox and Solida are not liable for indirect, punitive, or consequential damages resulting from institutional lending defaults, borrower credit risks, or unauthorized staff actions.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-xl font-semibold text-white tracking-tight">
              7. Inquiries & Legal Notices
            </h2>
            <p>
              For legal inquiries, corporate governance agreements, or compliance documentation, please reach out:
            </p>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-sm">
              <p className="font-semibold text-white">Solida Compliance Department</p>
              <p className="text-neutral-400 mt-1">Email: <a href="mailto:support@cylvox.com" className="text-[#e6c27a] hover:underline">support@cylvox.com</a></p>
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
