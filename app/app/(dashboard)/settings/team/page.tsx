import { redirect } from "next/navigation"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import { TeamManagement } from "./team-management"

export default async function TeamSettingsPage() {
  const session = await auth()
  const organizationId = (session?.user as any)?.organizationId

  if (!session?.user || !organizationId) {
    redirect("/app/login")
  }

  // Check if admin
  if ((session.user as any).role !== "ADMIN") {
    redirect("/app/dashboard")
  }

  const users = await prisma.user.findMany({
    where: { organizationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      branch: {
        select: {
          name: true,
        }
      }
    }
  })

  const branches = await prisma.branch.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  })

  let subscription = await prisma.subscription.findUnique({
    where: { organizationId },
    include: { plan: true },
  })

  let maxSeats = subscription?.plan?.maxOfficerSeats
  if (!maxSeats) {
    const defaultPlan = await prisma.subscriptionPlan.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" }
    })
    maxSeats = defaultPlan?.maxOfficerSeats ?? 3
  }

  return (
    <div className="max-w-[1000px] mx-auto">
      <TeamManagement 
        users={users} 
        branches={branches}
        quota={{ current: users.length, max: maxSeats }} 
      />
    </div>
  )
}
