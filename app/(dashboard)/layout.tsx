import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { SubscriptionBanner } from "@/components/subscription-banner"
import { DashboardHeader } from "@/components/dashboard-header"
import { AccessGate } from "@/components/access-gate"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const organizationId = (session?.user as any)?.organizationId

  const subscription = organizationId
    ? await prisma.subscription.findUnique({
        where: { organizationId },
      })
    : null

  const status = subscription?.status || "ACTIVE"
  const isSuspended = status === "SUSPENDED"

  return (
    <div className="min-h-screen bg-paper-white font-sans text-ink-black selection:bg-blush-peach selection:text-sienna-brown">
      {/* Access Gate (Redirects to /settings/billing if suspended) */}
      <AccessGate status={status} />

      {/* Global Subscription Banner (Top-most, above nav) */}
      <SubscriptionBanner />

      {/* Top Navigation and Sub-Navigation */}
      <DashboardHeader isSuspended={isSuspended} />

      {/* Main Content Canvas */}
      <main className="w-full max-w-[1200px] mx-auto px-6 py-[80px]">
        {children}
      </main>
    </div>
  )
}

