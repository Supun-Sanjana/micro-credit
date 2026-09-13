import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { DashboardShell } from "@/components/dashboard-shell"
import { SubscriptionBanner } from "@/components/subscription-banner"
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

  let orgName = "Solida"
  if (organizationId) {
    const org = await prisma.organization.findUnique({ where: { id: organizationId } })
    if (org) orgName = org.name
  }

  const status = subscription?.status || "ACTIVE"

  return (
    <div className="min-h-screen bg-paper-white font-sans text-ink-black selection:bg-blush-peach selection:text-sienna-brown flex flex-col">
      <AccessGate status={status} />
      <SubscriptionBanner />
      <DashboardShell user={session?.user} orgName={orgName}>
        {children}
      </DashboardShell>
    </div>
  )
}
