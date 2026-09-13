"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Landmark,
  LayoutGrid,
  FileText,
  Shield,
  Handshake,
  MapPinned,
  Wallet,
  UsersRound,
} from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { Footer } from "@/components/marketing/footer";

const operations = [
  {
    step: "01",
    title: "Branch",
    copy: "The institution’s local book. Managers see disbursements, cash in vault, and officer performance.",
  },
  {
    step: "02",
    title: "Center",
    copy: "The weekly meeting point. Attendance, installments, and peer pressure sit in one grid — not a notebook.",
  },
  {
    step: "03",
    title: "Member",
    copy: "The borrower, with guarantors, outstanding, and documents attached to a real person, not a row in Excel.",
  },
];

const features = [
  {
    icon: MapPinned,
    title: "Branches, centers, members",
    description:
      "Mirror how an MFI is actually organized. Staff work inside their territory instead of hunting across spreadsheets.",
  },
  {
    icon: Handshake,
    title: "Group lending & guarantors",
    description:
      "Link members to guarantors and group liability so field officers know who stands behind every loan.",
  },
  {
    icon: LayoutGrid,
    title: "Weekly collection grid",
    description:
      "Enter installments the way meetings happen: center by center, member by member, before the chair is stacked.",
  },
  {
    icon: Wallet,
    title: "Cash that must tally",
    description:
      "End-of-day reconciliation against physical cash. Fewer unexplained gaps between the field and the branch.",
  },
  {
    icon: FileText,
    title: "PAR, arrears, and exports",
    description:
      "Portfolio at risk, collection rates, and overdue lists your board and funders already ask for.",
  },
  {
    icon: Shield,
    title: "Roles that match the field",
    description:
      "Field officers, branch managers, and head office each see only what they should — including cash.",
  },
];

export default function Home() {
  return (
    <div className="relative min-h-screen bg-[#efe8dc] text-[#14231c] font-sans selection:bg-[#166534]/25 selection:text-[#166534] p-3 sm:p-4">
      <main className="flex flex-col items-center">
        <Hero />

        <section className="w-full py-16 sm:py-20">
          <div className="container mx-auto max-w-6xl px-4 md:px-6">
            <p className="mb-8 text-center text-[12px] font-semibold uppercase tracking-[0.2em] text-[#5d6b63]">
              Language microfinance already uses
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                ["Installments", "Weekly / monthly cycles"],
                ["PAR 30 / 90", "Risk the board understands"],
                ["Centers & groups", "Not anonymous accounts"],
                ["Field cash", "Counted before close of day"],
              ].map(([title, sub]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-[#d9cfc0] bg-[#f7f1e8] px-5 py-4"
                >
                  <div className="text-[15px] font-semibold tracking-tight">{title}</div>
                  <div className="mt-1 text-[13px] font-medium text-[#5d6b63]">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="operations" className="w-full py-8 sm:py-12">
          <div className="container mx-auto max-w-6xl px-4 md:px-6">
            <div className="mb-12 max-w-2xl">
              <h2
                className="text-4xl tracking-tight text-[#14231c] sm:text-5xl"
                style={{ fontFamily: "var(--font-instrument), Georgia, serif", fontStyle: "italic" }}
              >
                Structure first. Software second.
              </h2>
              <p className="mt-4 max-w-xl text-[15px] font-medium leading-relaxed text-[#5d6b63]">
                Microfinance does not run like a digital bank. It runs through people who
                meet, collect, and guarantee one another. Solida follows that hierarchy.
              </p>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {operations.map((item) => (
                <article
                  key={item.step}
                  className="rounded-[28px] border border-[#d9cfc0] bg-[#f7f1e8] p-7"
                >
                  <span className="text-[12px] font-semibold tracking-[0.18em] text-[#c9943e]">
                    {item.step}
                  </span>
                  <h3 className="mt-4 text-2xl font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-[14px] font-medium leading-relaxed text-[#5d6b63]">
                    {item.copy}
                  </p>
                </article>
              ))}
            </div>

            <div className="mt-4 overflow-hidden rounded-[28px] border border-[#d9cfc0] bg-[#10261c] text-[#f4efe6] lg:grid lg:grid-cols-2">
              <div className="p-8 sm:p-10">
                <p className="text-[12px] font-semibold uppercase tracking-[0.18em] text-[#e6c27a]">
                  A Tuesday in the field
                </p>
                <h3
                  className="mt-4 text-3xl leading-tight"
                  style={{ fontFamily: "var(--font-instrument), Georgia, serif", fontStyle: "italic" }}
                >
                  From the meeting mat to the branch cash box.
                </h3>
                <ol className="mt-8 space-y-5 text-[14px] font-medium">
                  {[
                    "Officer opens the center grid — names in the order they sit.",
                    "Installments marked paid, partial, or skipped with a reason.",
                    "Guarantor notified when a member slips into arrears.",
                    "Cash counted against the grid before returning to branch.",
                  ].map((line, i) => (
                    <li key={line} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-[11px] text-[#e6c27a]">
                        {i + 1}
                      </span>
                      <span className="text-[#f4efe6]/85">{line}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="flex min-h-[280px] flex-col justify-center border-t border-white/10 bg-[#0c1c15] p-6 sm:p-8 lg:border-l lg:border-t-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#e6c27a]">
                  End of day · Branch Kandy
                </p>
                <div className="mt-5 space-y-3">
                  {[
                    ["Grid total", "LKR 186,400"],
                    ["Cash counted", "LKR 186,400"],
                    ["Variance", "LKR 0"],
                    ["Centers closed", "6 of 6"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                    >
                      <span className="text-[13px] text-[#f4efe6]/65">{label}</span>
                      <span className="text-[14px] font-semibold tracking-tight">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-20 sm:py-24">
          <div className="container mx-auto max-w-6xl px-4 md:px-6">
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <h2
                className="text-4xl tracking-tight text-[#14231c] sm:text-5xl"
                style={{ fontFamily: "var(--font-instrument), Georgia, serif", fontStyle: "italic" }}
              >
                Operations the industry already lives.
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-[15px] font-medium leading-relaxed text-[#5d6b63]">
                Not another CRM. The daily work of an MFI — collections, groups, cash, and
                control — without inventing a new way of doing business.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="group flex flex-col rounded-[28px] border border-[#d9cfc0] bg-[#f7f1e8] p-6 shadow-sm transition-shadow hover:shadow-md md:p-8"
                >
                  <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e4d9c8] bg-white text-[#5d6b63] transition-colors group-hover:border-[#166534]/25 group-hover:bg-[#166534]/10 group-hover:text-[#166534]">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold tracking-tight">{feature.title}</h3>
                  <p className="text-[14px] font-medium leading-relaxed text-[#5d6b63]">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="w-full pb-8">
          <div className="container mx-auto max-w-6xl px-4 md:px-6">
            <div className="grid overflow-hidden rounded-[28px] border border-[#d9cfc0] bg-[#f7f1e8] md:grid-cols-3">
              {[
                {
                  icon: Landmark,
                  title: "Institutional, not startup-flavored",
                  copy: "Designed for MFIs, cooperatives, and last-mile lenders — the vocabulary of centers, not ‘users’.",
                },
                {
                  icon: UsersRound,
                  title: "People who guarantee each other",
                  copy: "Group methodology and guarantor chains stay visible, so credit risk is a relationship, not a score.",
                },
                {
                  icon: FileText,
                  title: "Numbers funders trust",
                  copy: "Collection efficiency and PAR sit next to the same books your officers already keep in the field.",
                },
              ].map((item, i) => (
                <div
                  key={item.title}
                  className={`p-8 ${i < 2 ? "border-b border-[#d9cfc0] md:border-b-0 md:border-r" : ""}`}
                >
                  <item.icon className="mb-4 h-5 w-5 text-[#c9943e]" />
                  <h3 className="text-[16px] font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-2 text-[14px] font-medium leading-relaxed text-[#5d6b63]">{item.copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="relative w-full py-20 sm:py-24">
          <div className="container relative z-10 mx-auto max-w-6xl px-4 md:px-6">
            <div className="mx-auto mb-14 max-w-3xl text-center">
              <h2
                className="text-4xl tracking-tight sm:text-5xl"
                style={{ fontFamily: "var(--font-instrument), Georgia, serif", fontStyle: "italic" }}
              >
                Pricing that scales with branches, not buzzwords.
              </h2>
            </div>

            <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-4 md:grid-cols-3">
              <div className="flex h-full flex-col rounded-3xl border border-[#d9cfc0] bg-[#f7f1e8] p-8 shadow-sm">
                <h3 className="text-lg font-semibold tracking-tight">Pilot</h3>
                <p className="mt-2 text-[13px] font-medium text-[#5d6b63]">Prove it on one branch first.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-semibold tracking-tighter">$0</span>
                  <span className="text-sm font-medium text-[#8a948e]">/mo</span>
                </div>
                <ul className="mt-8 flex-1 space-y-4">
                  {["1 Branch", "10 Staff", "20 Members", "100MB Storage"].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <Check className="h-4 w-4 shrink-0 text-[#c9c0b2]" />
                      <span className="text-[14px] font-medium tracking-tight text-[#3d4a44]">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/app/signup"
                  className="mt-8 flex h-11 w-full items-center justify-center rounded-xl border border-[#d9cfc0] bg-white text-[14px] font-semibold text-[#3d4a44] transition-colors hover:bg-[#efe8dc]"
                >
                  Start a pilot
                </Link>
              </div>

              <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-[#166534]/25 bg-[#f7f1e8] p-8 shadow-xl ring-4 ring-[#166534]/5">
                <div className="absolute right-5 top-5 rounded-full bg-[#166534]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#166534]">
                  For growing MFIs
                </div>
                <h3 className="text-lg font-semibold tracking-tight">Institution</h3>
                <p className="mt-2 text-[13px] font-medium text-[#5d6b63]">Multi-center operations, weekly grids included.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-semibold tracking-tighter">$49</span>
                  <span className="text-sm font-medium text-[#8a948e]">/mo</span>
                </div>
                <ul className="mt-8 flex-1 space-y-4">
                  {[
                    "Unlimited members & centers",
                    "Up to 5 branches",
                    "Guarantor tracking",
                    "Weekly collection grids",
                    "Email support",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <Check className="h-4 w-4 shrink-0 text-[#166534]" />
                      <span className="text-[14px] font-medium tracking-tight text-[#3d4a44]">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/app/signup"
                  className="mt-8 flex h-11 w-full items-center justify-center rounded-xl bg-[#10261c] text-[14px] font-semibold text-[#f4efe6] shadow-md transition-all hover:scale-[1.02] hover:bg-[#0c1c15] active:scale-[0.98]"
                >
                  Start free trial
                </Link>
              </div>

              <div className="flex h-full flex-col rounded-3xl border border-[#d9cfc0] bg-[#f7f1e8] p-8 shadow-sm">
                <h3 className="text-lg font-semibold tracking-tight">Network</h3>
                <p className="mt-2 text-[13px] font-medium text-[#5d6b63]">Multi-branch networks and custom workflows.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-5xl font-semibold tracking-tighter">Custom</span>
                </div>
                <ul className="mt-8 flex-1 space-y-4">
                  {["Unlimited branches", "Unlimited storage", "Custom workflows", "Dedicated manager"].map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <Check className="h-4 w-4 shrink-0 text-[#c9c0b2]" />
                      <span className="text-[14px] font-medium tracking-tight text-[#3d4a44]">{item}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="#contact"
                  className="mt-8 flex h-11 w-full items-center justify-center rounded-xl border border-[#d9cfc0] bg-transparent text-[14px] font-semibold text-[#3d4a44] transition-colors hover:bg-white"
                >
                  Talk to us
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section id="contact" className="mb-12 w-full py-16 sm:py-20">
          <div className="container relative z-10 mx-auto max-w-6xl px-4 md:px-6">
            <div className="grid items-center gap-16 md:grid-cols-2">
              <div>
                <h2
                  className="mb-6 text-4xl tracking-tight sm:text-5xl"
                  style={{ fontFamily: "var(--font-instrument), Georgia, serif", fontStyle: "italic" }}
                >
                  Bring your centers onto one book.
                </h2>
                <p className="mb-10 max-w-sm text-[15px] font-medium leading-relaxed text-[#5d6b63]">
                  Ask for a walkthrough with your own branch structure — or talk through
                  migrating members, loans, and historical collections.
                </p>
                <div className="space-y-6 text-[14px] font-medium text-[#3d4a44]">
                  {["Assisted onboarding for field teams", "Data migration from ledgers and sheets"].map((line) => (
                    <div key={line} className="flex items-center gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#d9cfc0] bg-white text-[#c9943e] shadow-sm">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                      <span className="tracking-tight">{line}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-12 border-t border-[#d9cfc0] pt-8">
                  <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-[#8a948e]">
                    Or email us directly
                  </p>
                  <a
                    href="mailto:solida@cylvox.com"
                    className="inline-flex items-center gap-3 text-[#14231c] transition-colors hover:text-black"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#166534]/10 text-[#166534]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                    </div>
                    <span className="font-semibold tracking-tight">solida@cylvox.com</span>
                  </a>
                </div>
              </div>

              <div className="rounded-3xl border border-[#d9cfc0] bg-[#f7f1e8] p-6 shadow-xl shadow-[#14231c]/5 md:p-8">
                <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-[13px] font-semibold">Name</label>
                      <input id="name" className="w-full rounded-xl border border-[#d9cfc0] bg-white px-4 py-2.5 text-[14px] font-medium placeholder:text-[#8a948e] focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/20" placeholder="Nimali Perera" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="org" className="text-[13px] font-semibold">Institution</label>
                      <input id="org" className="w-full rounded-xl border border-[#d9cfc0] bg-white px-4 py-2.5 text-[14px] font-medium placeholder:text-[#8a948e] focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/20" placeholder="Community MFI" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-[13px] font-semibold">Email</label>
                    <input id="email" type="email" className="w-full rounded-xl border border-[#d9cfc0] bg-white px-4 py-2.5 text-[14px] font-medium placeholder:text-[#8a948e] focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/20" placeholder="ops@yourmfi.org" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="message" className="text-[13px] font-semibold">How you collect today</label>
                    <textarea id="message" rows={4} className="w-full resize-none rounded-xl border border-[#d9cfc0] bg-white px-4 py-3 text-[14px] font-medium placeholder:text-[#8a948e] focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/20" placeholder="Centers per officer, weekly meetings, current ledgers…" />
                  </div>
                  <button type="submit" className="mt-2 w-full rounded-xl bg-[#10261c] px-4 py-3 text-[14px] font-semibold text-[#f4efe6] shadow-md transition-all hover:bg-[#0c1c15] active:scale-[0.98]">
                    Request a walkthrough
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>
      </main>
      <div className="px-0 pb-0">
        <Footer />
      </div>
    </div>
  );
}
