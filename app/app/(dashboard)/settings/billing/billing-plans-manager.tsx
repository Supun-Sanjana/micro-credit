"use client"

import { useState } from "react"
import { SUBSCRIPTION_PLANS, type PlanConfig } from "@/lib/plans"
import { ClaimForm } from "./claim-form"
import { Check, Sparkles, RefreshCw, ArrowUpRight, FileText } from "lucide-react"
import { InvoiceModal } from "@/components/billing/invoice-modal"

interface BillingPlansManagerProps {
  currentPlanId: string
  currentPlanName: string
  currentPlanPrice: number
  hasPendingClaim: boolean
  orgName?: string
}

export function BillingPlansManager({
  currentPlanId,
  currentPlanName,
  currentPlanPrice,
  hasPendingClaim,
  orgName,
}: BillingPlansManagerProps) {
  // Determine matching plan config for current plan
  const currentPlanConfig =
    SUBSCRIPTION_PLANS.find(
      (p) =>
        p.id.toLowerCase() === currentPlanId.toLowerCase() ||
        p.name.toLowerCase() === currentPlanName.toLowerCase()
    ) || SUBSCRIPTION_PLANS[1]

  const [selectedPlanId, setSelectedPlanId] = useState<string>(currentPlanConfig.id)
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [invoicePlan, setInvoicePlan] = useState<PlanConfig | null>(null)
  const [latestInvoiceRef, setLatestInvoiceRef] = useState<string>("")

  const selectedPlan =
    SUBSCRIPTION_PLANS.find((p) => p.id === selectedPlanId) || currentPlanConfig

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId)
    // Smooth scroll down to the claim section
    const el = document.getElementById("payment-claim-section")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <div className="flex flex-col gap-12">
      {/* Plans Section Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-block px-3 py-0.5 rounded-full text-xs font-semibold bg-[#166534]/10 text-[#166534] uppercase tracking-wider">
            Operational Tiers
          </span>
          <span className="text-xs text-slate-400">•</span>
          <span className="text-xs text-slate-500 font-medium">Grouped by platform capability</span>
        </div>
        <h2 className="text-[28px] font-sans font-medium text-navy-900 tracking-tight">
          Available Subscription Plans
        </h2>
        <p className="text-[15px] text-slate-500 mt-1 max-w-3xl">
          Choose the capacity and functional tier suited for your microfinance operations. Compare feature groups across tiers or select a plan to renew or upgrade.
        </p>
      </div>

      {/* 3-Column Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
        {SUBSCRIPTION_PLANS.map((plan) => {
          const isCurrentPlan =
            plan.id.toLowerCase() === currentPlanConfig.id.toLowerCase() ||
            plan.name.toLowerCase() === currentPlanName.toLowerCase()
          const isSelected = plan.id === selectedPlan.id

          return (
            <div
              key={plan.id}
              className={`relative flex flex-col rounded-[28px] p-8 transition-all ${
                isSelected && isCurrentPlan
                  ? "border-2 border-[#166534] bg-[#f7f2ea]/40 ring-4 ring-[#166534]/15 shadow-lg"
                  : isSelected && !isCurrentPlan
                  ? "border-2 border-navy-900 bg-white ring-4 ring-navy-900/10 shadow-md"
                  : isCurrentPlan && !isSelected
                  ? "border border-[#166534]/40 bg-[#f7f2ea]/20 shadow-subtle-3"
                  : "border border-border/40 bg-white hover:border-navy-900/30 shadow-subtle-3"
              }`}
            >
              {/* Badge */}
              <div className="absolute right-6 top-6">
                {isCurrentPlan ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#166534] text-white shadow-sm">
                    <Check className="h-3.5 w-3.5" />
                    Current Plan
                  </span>
                ) : isSelected ? (
                  <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-navy-900 text-white shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" />
                    Selected
                  </span>
                ) : plan.badge ? (
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                    {plan.badge}
                  </span>
                ) : null}
              </div>

              {/* Plan Header & Pricing */}
              <h3 className="text-2xl font-bold text-navy-950 font-serif tracking-tight pr-28">
                {plan.name}
              </h3>
              <p className="mt-2 text-[14px] text-slate-500 min-h-[44px] leading-relaxed">
                {plan.tagline}
              </p>

              <div className="mt-6 pb-6 border-b border-border/40">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl font-bold text-navy-950 tracking-tight">
                    LKR {plan.monthlyPrice.toLocaleString()}
                  </span>
                  <span className="text-[14px] font-medium text-slate-500">/ month</span>
                </div>

                <div className="mt-3 inline-flex flex-wrap items-center gap-2 text-xs font-semibold text-[#166534] bg-[#166534]/10 px-3 py-1.5 rounded-xl">
                  <span>{plan.maxOfficerSeats} Officer Seats</span>
                  <span>•</span>
                  <span>
                    {plan.maxBranches} {plan.maxBranches === 1 ? "Branch" : "Branches"}
                  </span>
                  <span>•</span>
                  <span>{plan.storageDisplay} Storage</span>
                </div>
              </div>

              {/* Plan Selection CTA Button */}
              <div className="mt-6 mb-8 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl text-[14px] font-semibold transition-all ${
                    isSelected && isCurrentPlan
                      ? "bg-[#166534] text-white shadow-md hover:bg-[#124d27]"
                      : isCurrentPlan && !isSelected
                      ? "border-2 border-[#166534]/60 text-[#166534] bg-white hover:bg-[#166534]/5"
                      : isSelected && !isCurrentPlan
                      ? "bg-navy-900 text-white shadow-md hover:opacity-90"
                      : plan.monthlyPrice > currentPlanPrice
                      ? "bg-navy-900 text-white shadow-sm hover:opacity-90"
                      : "border border-border/60 bg-white text-navy-900 hover:bg-slate-50"
                  }`}
                >
                  {isCurrentPlan && isSelected ? (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      <span>Selected for Renewal</span>
                    </>
                  ) : isCurrentPlan && !isSelected ? (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      <span>Renew This Plan</span>
                    </>
                  ) : plan.monthlyPrice > currentPlanPrice ? (
                    <>
                      <span>{isSelected ? "Selected for Upgrade" : `Upgrade to ${plan.name}`}</span>
                      <ArrowUpRight className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      <span>{isSelected ? "Selected" : `Switch to ${plan.name}`}</span>
                    </>
                  )}
                </button>

                {isSelected && (
                  <button
                    type="button"
                    onClick={() => {
                      setInvoicePlan(plan)
                      setInvoiceOpen(true)
                    }}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[13px] font-medium text-navy-900 border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <FileText className="h-4 w-4" />
                    <span>Download Invoice</span>
                  </button>
                )}
              </div>

              {/* Feature Groups Breakdown */}
              <div className="space-y-6">
                {plan.featureGroups.map((group) => (
                  <div key={group.category} className="space-y-2.5">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#166534]/90">
                      {group.category}
                    </h4>
                    <ul className="space-y-2">
                      {group.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-2.5 text-[13px] text-slate-700 leading-snug"
                        >
                          <Check className="h-4 w-4 shrink-0 text-[#166534] mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      <InvoiceModal
        open={invoiceOpen}
        onClose={() => setInvoiceOpen(false)}
        plan={invoicePlan}
        orgName={orgName}
        onInvoiceGenerated={setLatestInvoiceRef}
      />

      {/* Payment Claim Section (Bank Details + Form) */}
      <ClaimForm
        hasPendingClaim={hasPendingClaim}
        defaultAmount={selectedPlan.monthlyPrice}
        selectedPlan={selectedPlan}
        currentPlanName={currentPlanName}
        suggestedBankRef={latestInvoiceRef}
      />
    </div>
  )
}
