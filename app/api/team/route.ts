import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import bcrypt from "bcrypt"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const organizationId = (session.user as any)?.organizationId

    const userRole = (session.user as any).role
    if (!organizationId || (userRole !== "SYSTEM_ADMIN" && userRole !== "HEAD_OFFICE")) {
      return NextResponse.json(
        { error: "Unauthorized. Only organization admins can add team members." },
        { status: 401 }
      )
    }

    const { name, email, password, branchId, role } = await req.json()

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

    const validRoles = ["SYSTEM_ADMIN", "HEAD_OFFICE", "ACCOUNTANT", "BRANCH_MANAGER", "FIELD_OFFICER"]
    const assignedRole = role && validRoles.includes(role) ? role : "FIELD_OFFICER"

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: assignedRole,
        organizationId,
        branchId: branchId || null,
      },
    })

    if (process.env.RESEND_API_KEY) {
      const { Resend } = require("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)
      
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { name: true }
      })
      const orgName = organization?.name || "Our Organization"
      
      try {
        await resend.emails.send({
          from: `${orgName} <solida@cylvox.com>`,
          to: email,
          subject: `Welcome to ${orgName} - Your Login Details`,
          html: `
            <div style="font-family: 'Inter', system-ui, sans-serif; color: #1E293B; background-color: #F1F5F9; padding: 40px 20px;">
              <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);">
                <div style="background-color: #0B2439; padding: 30px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">${orgName}</h1>
                </div>
                <div style="padding: 40px 30px;">
                  <h2 style="margin-top: 0; color: #0F172A; font-size: 20px;">Welcome, ${name}!</h2>
                  <p style="color: #475569; line-height: 1.6; font-size: 15px;">An account has been created for you on the <strong>${orgName}</strong> platform.</p>
                  
                  <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 20px; border-radius: 10px; margin: 25px 0;">
                    <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Your Email (Login ID)</p>
                    <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; color: #0F172A;">${email}</p>
                                        <p style="margin: 0 0 10px 0; font-size: 13px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.5px;">Getting Started</p>
                    <p style="margin: 0; font-size: 15px; color: #475569; line-height: 1.6;">Your temporary password has been set by your administrator. Please contact them directly to receive it securely.</p>
                  </div>
                  
                  <div style="text-align: center; margin-top: 35px;">
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/app/login" style="display: inline-block; background-color: #0F766E; color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 15px;">Sign In to Your Account</a>
                  </div>
                  
                  <p style="color: #94A3B8; font-size: 13px; text-align: center; margin-top: 40px;">
                    Please log in and keep these credentials safe. We recommend changing your temporary password after your first login.
                    <br><br>
                    <span style="color: #CBD5E1; font-size: 12px;">Powered by Solida</span>
                  </p>
                </div>
              </div>
            </div>
          `
        })
      } catch (emailError) {
        console.error("Failed to send welcome email:", emailError)
      }
    }

    return NextResponse.json({ success: true, user: { id: user.id, email: user.email, name: user.name } })
  } catch (error: any) {
    console.error("Team creation error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  try {
    const session = await auth()
    const organizationId = (session?.user as any)?.organizationId

    if (!session || !organizationId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      where: { organizationId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        branchId: true,
      }
    })

    return NextResponse.json(users)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
