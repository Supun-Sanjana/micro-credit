import prisma from "@/lib/prisma"

export interface SubscriptionCheckResult {
  isRestricted: boolean
  status: "ACTIVE" | "TRIAL" | "SUSPENDED" | "CANCELLED" | "PENDING_VERIFICATION"
  reason?: "TRIAL_EXPIRED" | "PERIOD_EXPIRED" | "SUSPENDED" | "CANCELLED" | "NO_SUBSCRIPTION"
  daysRemaining?: number
}

/**
 * Validates the subscription for an organization.
 * Automatically synchronizes expired trials or expired periods to "SUSPENDED" in the database.
 */
export async function getSubscriptionStatus(organizationId: string): Promise<SubscriptionCheckResult> {
  let subscription = await prisma.subscription.findUnique({
    where: { organizationId },
  })

  // Auto-provision trial if missing (matching billing page behavior)
  if (!subscription) {
    const defaultPlan = await prisma.subscriptionPlan.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    })

    if (defaultPlan) {
      try {
        subscription = await prisma.subscription.create({
          data: {
            organizationId,
            planId: defaultPlan.id,
            status: "TRIAL",
            trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          },
        })
      } catch (err) {
        console.error("Failed to auto-create subscription:", err)
      }
    }

    if (!subscription) {
      return {
        isRestricted: true,
        status: "SUSPENDED",
        reason: "NO_SUBSCRIPTION",
      }
    }
  }

  const now = new Date()

  // 1. Explicitly SUSPENDED or CANCELLED
  if (subscription.status === "SUSPENDED" || subscription.status === "CANCELLED") {
    return {
      isRestricted: true,
      status: subscription.status,
      reason: subscription.status,
      daysRemaining: 0,
    }
  }

  // 2. TRIAL status check
  if (subscription.status === "TRIAL") {
    const isExpired = !subscription.trialEndsAt || new Date(subscription.trialEndsAt) <= now

    if (isExpired) {
      // Synchronize database to SUSPENDED so state is immediately consistent
      try {
        await prisma.subscription.update({
          where: { organizationId },
          data: { status: "SUSPENDED" },
        })
      } catch (err) {
        console.error("Failed to sync expired trial to SUSPENDED:", err)
      }

      return {
        isRestricted: true,
        status: "SUSPENDED",
        reason: "TRIAL_EXPIRED",
        daysRemaining: 0,
      }
    }

    // Active trial calculation
    const diffMs = new Date(subscription.trialEndsAt!).getTime() - now.getTime()
    const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

    return {
      isRestricted: false,
      status: "TRIAL",
      daysRemaining,
    }
  }

  // 3. ACTIVE status check
  if (subscription.status === "ACTIVE") {
    const isExpired = !!subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) <= now

    if (isExpired) {
      try {
        await prisma.subscription.update({
          where: { organizationId },
          data: { status: "SUSPENDED" },
        })
      } catch (err) {
        console.error("Failed to sync expired period to SUSPENDED:", err)
      }

      return {
        isRestricted: true,
        status: "SUSPENDED",
        reason: "PERIOD_EXPIRED",
        daysRemaining: 0,
      }
    }

    return {
      isRestricted: false,
      status: "ACTIVE",
    }
  }

  // 4. Any other non-active statuses
  return {
    isRestricted: false,
    status: subscription.status as any,
  }
}

/**
 * Enforces active subscription check.
 * Throws "ORG_SUSPENDED" if organization's trial or subscription has expired or is suspended.
 */
export async function ensureActiveSubscription(organizationId: string): Promise<SubscriptionCheckResult> {
  const result = await getSubscriptionStatus(organizationId)
  if (result.isRestricted) {
    throw new Error("ORG_SUSPENDED")
  }
  return result
}

/**
 * Standard HTTP 403 Forbidden response helper for API routes when an organization is restricted.
 */
export function handleSuspendedApiError(error: any) {
  if (error?.message === "ORG_SUSPENDED") {
    const { NextResponse } = require("next/server")
    return NextResponse.json(
      {
        error: "ORG_SUSPENDED",
        message: "Free trial or subscription has expired. Please submit a payment claim in Settings to restore access.",
      },
      { status: 403 }
    )
  }
  return null
}
