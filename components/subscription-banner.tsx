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
      <div className="w-full bg-mist-gray text-ink-black py-2 px-4 text-center text-[13px] font-medium border-b border-[#ececec]">
        Your recent payment claim is under review. Thank you for your patience.
      </div>
    )
  }

  // Priority 2: If status === SUSPENDED
  if (subscription.status === "SUSPENDED") {
    return (
      <div className="w-full bg-[#fce8e6] text-[#c5221f] py-2 px-4 text-center text-[13px] font-medium border-b border-[#c5221f]/15">
        Your account has been suspended due to billing issues. Please submit a payment claim in{" "}
        <Link href="/settings/billing" className="underline font-semibold hover:opacity-80">
          Settings
        </Link>{" "}
        to restore full access.
      </div>
    )
  }

  // Priority 3: If status === TRIAL
  if (subscription.status === "TRIAL") {
    let daysRemaining = 0
    if (subscription.trialEndsAt) {
      const diffMs = new Date(subscription.trialEndsAt).getTime() - Date.now()
      daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    }

    return (
      <div className="w-full bg-[#fbe1d1] text-[#5d2a1a] py-2 px-4 text-center text-[13px] font-medium border-b border-[#5d2a1a]/15">
        You are on a free trial with {daysRemaining} {daysRemaining === 1 ? "day" : "days"} remaining. Submit a payment claim in{" "}
        <Link href="/settings/billing" className="underline font-semibold hover:opacity-80">
          Settings
        </Link>{" "}
        to upgrade.
      </div>
    )
  }

  // Priority 4: If ACTIVE or none of the above
  return null
}
