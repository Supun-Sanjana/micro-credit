import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { ClaimForm } from "./claim-form"
import { ShieldCheck, HardDrive, Users, Building2, Calendar, CreditCard, Clock } from "lucide-react"

export default async function BillingSettingsPage() {
  const session = await auth()
  const organizationId = (session?.user as any)?.organizationId

  if (!session?.user || !organizationId) {
    redirect("/app/login")
  }

  // Fetch tenant's Subscription with plan and payment claims
  let subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: {
      plan: true,
      paymentClaims: {
        orderBy: { submittedAt: "desc" },
      },
    },
  })

  // Auto-provision default trial subscription if tenant doesn't have one yet
  if (!subscription) {
    const defaultPlan = await prisma.subscriptionPlan.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    })

    if (defaultPlan) {
      subscription = await prisma.subscription.upsert({
        where: { organizationId },
        update: {},
        create: {
          organizationId,
          planId: defaultPlan.id,
          status: "TRIAL",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
        include: {
          plan: true,
          paymentClaims: {
            orderBy: { submittedAt: "desc" },
          },
        },
      })
    }
  }

  const hasPendingClaim =
    subscription?.paymentClaims.some((c) => c.status === "PENDING") ?? false

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#e6f4ea] text-[#137333] border border-[#137333]/15">
            ACTIVE
          </span>
        )
      case "TRIAL":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#fbe1d1] text-[#5d2a1a] border border-[#5d2a1a]/15">
            FREE TRIAL
          </span>
        )
      case "PENDING":
      case "PENDING_VERIFICATION":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#fbe1d1] text-[#5d2a1a] border border-[#5d2a1a]/15">
            PENDING VERIFICATION
          </span>
        )
      case "SUSPENDED":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#fce8e6] text-[#c5221f] border border-[#c5221f]/15">
            SUSPENDED
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-500">
            {status}
          </span>
        )
    }
  }

  const getClaimStatusBadge = (status: string) => {
    switch (status) {
      case "VERIFIED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#e6f4ea] text-[#137333]">
            Verified
          </span>
        )
      case "PENDING":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#fbe1d1] text-[#5d2a1a]">
            Pending Review
          </span>
        )
      case "REJECTED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#fce8e6] text-[#c5221f]">
            Rejected
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-slate-50 text-slate-500">
            {status}
          </span>
        )
    }
  }

  const formatDate = (date: Date | null | undefined) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="flex flex-col gap-10 max-w-[1000px] mx-auto pb-16 font-sans">
      {/* Header */}
      <div>
        <h1
          className="text-[44px] leading-[1.25] text-navy-900 font-serif font-normal"
          style={{ letterSpacing: "-0.66px" }}
        >
          Subscription & Billing
        </h1>
        <p className="text-[17px] text-slate-500 mt-2">
          Manage your organization plan, resource quotas, and offline payment claims.
        </p>
      </div>

      {subscription && (
        <>
          {/* Plan Overview Card */}
          <div className="bg-white rounded-[24px] shadow-subtle-3 p-8 border border-border/30 flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/40">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-[26px] font-medium text-navy-900 tracking-tight">
                    {subscription.plan.name}
                  </h2>
                  {getStatusBadge(subscription.status)}
                </div>
                <p className="text-[15px] text-slate-500 mt-1">
                  Current subscription tier assigned to your organization.
                </p>
              </div>

              <div className="text-left sm:text-right">
                <div className="text-[28px] font-medium text-navy-900 tracking-tight">
                  LKR {Number(subscription.plan.monthlyPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[14px] text-slate-500">per month</div>
              </div>
            </div>

            {/* Quota Limits & Dates Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-slate-100 p-5 rounded-[18px] border border-border/30">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Users className="h-4 w-4" />
                  <span className="text-[13px] font-medium uppercase tracking-wider">Officer Seats</span>
                </div>
                <div className="text-[22px] font-medium text-navy-900">
                  {subscription.plan.maxOfficerSeats} <span className="text-[14px] font-normal text-slate-500">seats</span>
                </div>
              </div>

              <div className="bg-slate-100 p-5 rounded-[18px] border border-border/30">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Building2 className="h-4 w-4" />
                  <span className="text-[13px] font-medium uppercase tracking-wider">Branches</span>
                </div>
                <div className="text-[22px] font-medium text-navy-900">
                  {subscription.plan.maxBranches} <span className="text-[14px] font-normal text-slate-500">locations</span>
                </div>
              </div>

              <div className="bg-slate-100 p-5 rounded-[18px] border border-border/30">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <HardDrive className="h-4 w-4" />
                  <span className="text-[13px] font-medium uppercase tracking-wider">Storage Quota</span>
                </div>
                <div className="text-[22px] font-medium text-navy-900">
                  {subscription.plan.storageQuotaMb >= 1024
                    ? `${(subscription.plan.storageQuotaMb / 1024).toFixed(1)} GB`
                    : `${subscription.plan.storageQuotaMb} MB`}
                </div>
              </div>

              <div className="bg-slate-100 p-5 rounded-[18px] border border-border/30">
                <div className="flex items-center gap-2 text-slate-500 mb-2">
                  <Calendar className="h-4 w-4" />
                  <span className="text-[13px] font-medium uppercase tracking-wider">
                    {subscription.status === "TRIAL" ? "Trial Ends" : "Period End"}
                  </span>
                </div>
                <div className="text-[20px] font-medium text-navy-900">
                  {subscription.status === "TRIAL"
                    ? formatDate(subscription.trialEndsAt)
                    : formatDate(subscription.currentPeriodEnd)}
                </div>
              </div>
            </div>

            {/* Trial / Validity Timeline Info */}
            <div className="flex flex-wrap items-center justify-between text-[14px] text-slate-500 pt-4 border-t border-border/40 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <span>Trial ends: <strong>{formatDate(subscription.trialEndsAt)}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-slate-500" />
                <span>Current period ends: <strong>{formatDate(subscription.currentPeriodEnd)}</strong></span>
              </div>
            </div>
          </div>

          {/* B3 Payment Claim Form Component */}
          <ClaimForm
            hasPendingClaim={hasPendingClaim}
            defaultAmount={Number(subscription.plan.monthlyPrice)}
          />

          {/* Past Payment Claims Table */}
          <div className="bg-white rounded-[24px] shadow-subtle-3 p-8 border border-border/30">
            <div className="mb-6">
              <h3 className="text-[22px] font-sans font-medium text-navy-900 tracking-tight">
                Payment Claims History
              </h3>
              <p className="text-[15px] text-slate-500 mt-1">
                Record of offline bank deposits and subscription renewal submissions.
              </p>
            </div>

            {subscription.paymentClaims.length === 0 ? (
              <div className="rounded-[18px] bg-slate-100 p-8 text-center text-slate-500 text-[15px] border border-border/30">
                No payment claims submitted yet.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[14px]">
                  <thead>
                    <tr className="border-b border-border/40 text-slate-500 text-[13px] uppercase tracking-wider font-medium">
                      <th className="py-3.5 px-4">Amount</th>
                      <th className="py-3.5 px-4">Bank Reference</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Paid Date</th>
                      <th className="py-3.5 px-4">Submitted At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/20 text-navy-900">
                    {subscription.paymentClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-slate-100/60 transition-colors">
                        <td className="py-4 px-4 font-medium whitespace-nowrap">
                          LKR {Number(claim.amount).toLocaleString("en-US", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-4 font-mono text-[13px] text-slate-500">
                          {claim.bankReference}
                        </td>
                        <td className="py-4 px-4 whitespace-nowrap">
                          {getClaimStatusBadge(claim.status)}
                        </td>
                        <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                          {formatDate(claim.paidDate)}
                        </td>
                        <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                          {formatDate(claim.submittedAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
