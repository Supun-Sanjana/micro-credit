import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import bcrypt from "bcrypt"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const organizationId = (session?.user as any)?.organizationId

    if (!session || !organizationId || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Unauthorized. Only organization admins can add team members." },
        { status: 401 }
      )
    }

    const { name, email, password, branchId } = await req.json()

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required." },
        { status: 400 }
      )
    }

    // Check plan quotas
    const subscription = await prisma.subscription.findUnique({
      where: { organizationId },
      include: { plan: true },
    })

    const maxSeats = subscription?.plan?.maxOfficerSeats ?? 3

    const currentSeats = await prisma.user.count({
      where: { organizationId },
    })

    if (currentSeats >= maxSeats) {
      return NextResponse.json(
        { error: "You have reached the maximum number of team members allowed on your current plan (" + maxSeats + ")." },
        { status: 403 }
      )
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER",
        organizationId,
        branchId: branchId || null,
      },
    })

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
  } catch (error: any) {
    console.error("Team creation error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    )
  }
}
