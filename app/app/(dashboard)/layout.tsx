import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { headers } from "next/headers"
import prisma from "@/lib/prisma"
import { getSubscriptionStatus } from "@/lib/subscription"
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

  let orgName = "Solida"
  let isRestricted = false
  let status = "ACTIVE"

  if (organizationId) {
    const subStatus = await getSubscriptionStatus(organizationId)
    isRestricted = subStatus.isRestricted
    status = subStatus.status

    const org = await prisma.organization.findUnique({ where: { id: organizationId } })
    if (org) orgName = org.name
  }

  // Server-side route lockdown:
  // If tenant is restricted, they are strictly limited to /app/settings/billing
  if (isRestricted) {
    const headersList = await headers()
    const currentPath = headersList.get("x-pathname") || ""
    if (currentPath && !currentPath.startsWith("/app/settings/billing")) {
      redirect("/app/settings/billing")
    }
  }

  return (
    <div className="h-screen max-h-screen overflow-hidden bg-white font-sans text-navy-900 selection:bg-brand-50 selection:text-brand-700 flex flex-col">
      <AccessGate status={status} isRestricted={isRestricted} />
      <div className="shrink-0">
        <SubscriptionBanner />
      </div>
      <DashboardShell user={session?.user} orgName={orgName} isRestricted={isRestricted}>
        {children}
      </DashboardShell>
    </div>
  )
}
