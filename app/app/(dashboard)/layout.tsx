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
  if (!session?.user) {
    redirect('/app/login')
  }
  const organizationId = (session?.user as any)?.organizationId

  let orgName = "Solida"
  let isRestricted = false
  let status = "ACTIVE"

  if (organizationId) {
    const orgUser = await prisma.user.findUnique({ 
      where: { id: session?.user?.id as string },
      select: { isActive: true } 
    })

    if (orgUser && orgUser.isActive === false) {
      return (
        <div className="flex items-center justify-center h-screen w-screen bg-slate-50 font-sans">
          <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md border border-border/40">
            <div className="w-12 h-12 bg-danger-50 text-danger-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m4.9 4.9 14.2 14.2"/></svg>
            </div>
            <h1 className="text-xl font-medium text-navy-900 mb-2">Account Suspended</h1>
            <p className="text-slate-500 mb-6">Your access to this organization has been suspended. Please contact your administrator for more information.</p>
            <form action={async () => {
              "use server"
              const { signOut } = await import("@/auth")
              await signOut()
            }}>
              <button type="submit" className="bg-navy-900 text-white hover:bg-navy-800 transition-colors px-6 py-2 rounded-xl font-medium w-full">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      )
    }

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
