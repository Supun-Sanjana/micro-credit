import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import bcrypt from "bcrypt"

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { orgName, adminName, email, password } = body

    if (!orgName || !adminName || !email || !password) {
      return NextResponse.json(
        { error: "Organization name, administrator name, email, and password are required." },
        { status: 400 }
      )
    }

    if (typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 }
      )
    }

    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    // Validate email doesn't already exist
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      )
    }

    // Hash password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 10)

    // Find the default active SubscriptionPlan
    const defaultPlan = await prisma.subscriptionPlan.findFirst({
      where: { isActive: true },
      orderBy: { createdAt: "asc" },
    })

    if (!defaultPlan) {
      return NextResponse.json(
        { error: "No active subscription plan found. Please contact support." },
        { status: 500 }
      )
    }

    // Calculate trial period: 14 days from now
    const now = new Date()
    const trialEndsAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

    // Execute atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: orgName.trim(),
        },
      })

      const user = await tx.user.create({
        data: {
          name: adminName.trim(),
          email: normalizedEmail,
          password: hashedPassword,
          role: "SYSTEM_ADMIN",
          organizationId: organization.id,
        },
      })

      const subscription = await tx.subscription.create({
        data: {
          organizationId: organization.id,
          planId: defaultPlan.id,
          status: "TRIAL",
          trialEndsAt: trialEndsAt,
        },
      })

      return { organization, user, subscription }
    })

    return NextResponse.json(
      {
        success: true,
        message: "Organization and admin account created successfully.",
        organizationId: result.organization.id,
        userId: result.user.id,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred while creating your account. Please try again." },
      { status: 500 }
    )
  }
}
