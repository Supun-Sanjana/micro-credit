import Link from "next/link"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function SubscriptionBanner() {
  const session = await auth()
  const organizationId = (session?.user as any)?.organizationId

  if (!session?.user || !organizationId) {
    return null
  }

  const subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: {
      paymentClaims: {
        orderBy: { submittedAt: "desc" },
        take: 1,
      },
    },
  })

  if (!subscription) {
    return null
  }

  const latestClaim = subscription.paymentClaims[0]

  // Priority 1: If latest claim is PENDING
  if (latestClaim && latestClaim.status === "PENDING") {
    return (
      <div className="w-full bg-slate-50 text-navy-900 py-2.5 px-4 text-center text-[13px] font-medium border-b border-[#ececec]">
        Your recent payment claim is under review. Thank you for your patience while our platform team verifies it.
      </div>
    )
  }

  // Priority 2: If status === SUSPENDED or CANCELLED
  if (subscription.status === "SUSPENDED" || subscription.status === "CANCELLED") {
    return (
      <div className="w-full bg-[#fce8e6] text-[#c5221f] py-2.5 px-4 text-center text-[13px] font-medium border-b border-[#c5221f]/15">
        Your account is currently restricted due to billing issues. Please submit a payment claim in{" "}
        <Link href="/app/settings/billing" className="underline font-semibold hover:opacity-80">
          Settings &rarr; Billing
        </Link>{" "}
        to restore full access.
      </div>
    )
  }

  // Priority 3: If status === TRIAL
  if (subscription.status === "TRIAL") {
    const now = Date.now()
    const trialEndTime = subscription.trialEndsAt ? new Date(subscription.trialEndsAt).getTime() : 0
    const diffMs = trialEndTime - now

    // Trial has expired
    if (diffMs <= 0) {
      return (
        <div className="w-full bg-[#fce8e6] text-[#c5221f] py-2.5 px-4 text-center text-[13px] font-medium border-b border-[#c5221f]/15">
          Your free trial has ended and operational access is restricted. Please submit a payment claim in{" "}
          <Link href="/app/settings/billing" className="underline font-semibold hover:opacity-80">
            Settings &rarr; Billing
          </Link>{" "}
          to upgrade and restore full access.
        </div>
      )
    }

    const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    return (
      <div className="w-full bg-[#fbe1d1] text-[#5d2a1a] py-2 px-4 text-center text-[13px] font-medium border-b border-[#5d2a1a]/15">
        You are on a free trial with {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining. Submit a payment claim in{" "}
        <Link href="/app/settings/billing" className="underline font-semibold hover:opacity-80">
          Settings
        </Link>{" "}
        to upgrade.
      </div>
    )
  }

  // Priority 4: If ACTIVE but currentPeriodEnd has expired
  if (subscription.status === "ACTIVE" && subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd).getTime() <= Date.now()) {
    return (
      <div className="w-full bg-[#fce8e6] text-[#c5221f] py-2.5 px-4 text-center text-[13px] font-medium border-b border-[#c5221f]/15">
        Your subscription period has ended. Please submit a payment claim in{" "}
        <Link href="/app/settings/billing" className="underline font-semibold hover:opacity-80">
          Settings &rarr; Billing
        </Link>{" "}
        to renew your access.
      </div>
    )
  }

  return null
}
