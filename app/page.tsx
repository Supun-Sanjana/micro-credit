"use client";

import { useState } from "react";

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
  Loader2,
} from "lucide-react";
import { Hero } from "@/components/marketing/hero";
import { Footer } from "@/components/marketing/footer";
import { submitContactForm } from "./actions/contact";
import { triggerNavigationProgress } from "@/components/top-loading-bar";
import { SUBSCRIPTION_PLANS } from "@/lib/plans";

const operations = [
  {
    step: "01",
    title: "Branch",
    copy: "The institution's local book. Managers see disbursements, cash in vault, and officer performance.",
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [navigatingHref, setNavigatingHref] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);
    
    const formData = new FormData(e.currentTarget);
    const result = await submitContactForm(formData);
    
    setIsSubmitting(false);
    if (result?.error) {
      setSubmitError(result.error);
    } else {
      setIsSubmitted(true);
    }
  };

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
                  copy: "Designed for MFIs, cooperatives, and last-mile lenders — the vocabulary of centers, not 'users'.",
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

        <section id="pricing" className="relative w-full py-20 sm:py-28 bg-[#fdfbf7]">
          <div className="container relative z-10 mx-auto max-w-7xl px-4 md:px-6">
            <div className="mx-auto mb-16 max-w-3xl text-center">
              <span className="inline-block px-3.5 py-1 rounded-full text-xs font-semibold bg-[#166534]/10 text-[#166534] uppercase tracking-wider mb-4">
                Institutional Microfinance Plans
              </span>
              <h2
                className="text-4xl tracking-tight sm:text-5xl text-navy-950 font-normal"
                style={{ fontFamily: "var(--font-instrument), Georgia, serif", fontStyle: "italic" }}
              >
                Plans that scale with your loan book, not hidden surprises.
              </h2>
              <p className="mt-4 text-[16px] text-[#5d6b63] max-w-2xl mx-auto">
                Every plan includes a 14-day full-access free trial. No credit card required upfront. Offline bank deposit claims supported.
              </p>
            </div>

            <div className="mx-auto grid max-w-7xl grid-cols-1 items-stretch gap-8 lg:grid-cols-3">
              {SUBSCRIPTION_PLANS.map((plan) => {
                const isGrowth = plan.name === "Growth";
                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col rounded-3xl p-8 transition-all ${
                      isGrowth
                        ? "border-2 border-[#166534] bg-[#f7f2ea] shadow-xl ring-4 ring-[#166534]/10"
                        : "border border-[#d9cfc0] bg-[#fbf7f0] shadow-sm hover:border-[#166534]/40"
                    }`}
                  >
                    {plan.badge && (
                      <div className="absolute right-6 top-6 rounded-full bg-[#166534] px-3.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white shadow-sm">
                        {plan.badge}
                      </div>
                    )}

                    <div>
                      <h3 className="text-2xl font-bold text-navy-950 tracking-tight">{plan.name}</h3>
                      <p className="mt-2 text-[14px] text-[#5d6b63] min-h-[44px] leading-relaxed">
                        {plan.tagline}
                      </p>
                    </div>

                    <div className="mt-6 pb-6 border-b border-[#d9cfc0]/60">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-3xl sm:text-4xl font-bold text-navy-950 tracking-tight">
                          LKR {plan.monthlyPrice.toLocaleString()}
                        </span>
                        <span className="text-[14px] font-medium text-[#7c8880]">/ month</span>
                      </div>
                      <div className="mt-3 inline-flex flex-wrap items-center gap-2 text-xs font-semibold text-[#166534] bg-[#166534]/10 px-3 py-1.5 rounded-lg">
                        <span>{plan.maxOfficerSeats} Officer Seats</span>
                        <span>•</span>
                        <span>{plan.maxBranches} {plan.maxBranches === 1 ? "Branch" : "Branches"}</span>
                        <span>•</span>
                        <span>{plan.storageDisplay} Storage</span>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-6 mb-8">
                      <Link
                        href={plan.name === "Enterprise" ? "#contact" : "/app/signup"}
                        onClick={() => {
                          if (plan.name !== "Enterprise") {
                            setNavigatingHref(plan.id);
                            triggerNavigationProgress("start");
                          }
                        }}
                        className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-all ${
                          isGrowth
                            ? "bg-[#10261c] text-[#f4efe6] shadow-md hover:bg-[#0c1c15] hover:scale-[1.01]"
                            : "border border-[#d9cfc0] bg-white text-navy-900 hover:bg-[#efe8dc]"
                        }`}
                      >
                        {navigatingHref === plan.id ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin text-current" />
                            <span>Loading...</span>
                          </>
                        ) : plan.name === "Enterprise" ? (
                          "Contact Enterprise Sales"
                        ) : (
                          "Start 14-Day Free Trial"
                        )}
                      </Link>
                    </div>

                    {/* Feature Groups */}
                    <div className="flex-1 space-y-6">
                      {plan.featureGroups.map((group) => (
                        <div key={group.category} className="space-y-2.5">
                          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#166534]/90">
                            {group.category}
                          </h4>
                          <ul className="space-y-2">
                            {group.features.map((feature) => (
                              <li key={feature} className="flex items-start gap-2.5 text-[13px] text-[#3d4a44] leading-snug">
                                <Check className="h-4 w-4 shrink-0 text-[#166534] mt-0.5" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
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
                {isSubmitted ? (
                  <div className="flex flex-col items-center justify-center text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-[#166534]/10 rounded-full flex items-center justify-center mb-2">
                      <Check className="w-8 h-8 text-[#166534]" />
                    </div>
                    <h3 className="text-xl font-bold tracking-tight">Request Received!</h3>
                    <p className="text-[14px] text-[#5d6b63] max-w-sm">
                      Thank you for reaching out. We'll be in touch with you shortly to schedule a personalized walkthrough of Solida.
                    </p>
                  </div>
                ) : (
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-[13px] font-semibold">Name</label>
                        <input id="name" name="name" required className="w-full rounded-xl border border-[#d9cfc0] bg-white px-4 py-2.5 text-[14px] font-medium placeholder:text-[#8a948e] focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/20" placeholder="Nimali Perera" />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="org" className="text-[13px] font-semibold">Institution</label>
                        <input id="org" name="org" required className="w-full rounded-xl border border-[#d9cfc0] bg-white px-4 py-2.5 text-[14px] font-medium placeholder:text-[#8a948e] focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/20" placeholder="Community MFI" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-[13px] font-semibold">Email</label>
                      <input id="email" name="email" type="email" required className="w-full rounded-xl border border-[#d9cfc0] bg-white px-4 py-2.5 text-[14px] font-medium placeholder:text-[#8a948e] focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/20" placeholder="ops@yourmfi.org" />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="message" className="text-[13px] font-semibold">How you collect today</label>
                      <textarea id="message" name="message" required rows={4} className="w-full resize-none rounded-xl border border-[#d9cfc0] bg-white px-4 py-3 text-[14px] font-medium placeholder:text-[#8a948e] focus:border-[#166534] focus:outline-none focus:ring-2 focus:ring-[#166534]/20" placeholder="Centers per officer, weekly meetings, current ledgers." />
                    </div>
                    <button disabled={isSubmitting} type="submit" className="mt-2 w-full rounded-xl bg-[#10261c] px-4 py-3 text-[14px] font-semibold text-[#f4efe6] shadow-md transition-all hover:bg-[#0c1c15] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none">
                      {isSubmitting ? "Sending request..." : "Request a walkthrough"}
                    </button>
                    {submitError && (
                      <div className="mt-4 text-[13px] font-medium text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
                        {submitError}
                      </div>
                    )}
                  </form>
                )}
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
