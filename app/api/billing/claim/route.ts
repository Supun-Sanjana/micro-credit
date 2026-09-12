import { NextResponse } from "next/server"
import { auth } from "@/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    const organizationId = (session?.user as any)?.organizationId

    if (!session || !organizationId) {
      return NextResponse.json(
        { error: "Unauthorized. Please sign in to submit a payment claim." },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { amount, bankReference, paidDate, proofUrl } = body

    if (!amount || !bankReference || !paidDate) {
      return NextResponse.json(
        { error: "Payment amount, bank reference, and paid date are required." },
        { status: 400 }
      )
    }

    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Please enter a valid positive payment amount." },
        { status: 400 }
      )
    }

    const parsedDate = new Date(paidDate)
    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: "Please enter a valid paid date." },
        { status: 400 }
      )
    }

    // Find the tenant's subscription
    let subscription = await prisma.subscription.findUnique({
      where: { organizationId },
    })

    if (!subscription) {
      // Fallback: auto-assign default plan if tenant subscription hasn't been created yet
      const defaultPlan = await prisma.subscriptionPlan.findFirst({
        where: { isActive: true },
        orderBy: { createdAt: "asc" },
      })

      if (!defaultPlan) {
        return NextResponse.json(
          { error: "No active subscription plan found in the system." },
          { status: 404 }
        )
      }

      subscription = await prisma.subscription.upsert({
        where: { organizationId },
        update: {},
        create: {
          organizationId,
          planId: defaultPlan.id,
          status: "TRIAL",
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      })
    }

    // Check if there is already a claim currently in PENDING status
    const existingPending = await prisma.paymentClaim.findFirst({
      where: {
        subscriptionId: subscription.id,
        status: "PENDING",
      },
    })

    if (existingPending) {
      return NextResponse.json(
        { error: "A payment claim is already currently under review." },
        { status: 409 }
      )
    }

    // Create PaymentClaim
    const claim = await prisma.paymentClaim.create({
      data: {
        subscriptionId: subscription.id,
        amount: parsedAmount,
        bankReference: bankReference.trim(),
        paidDate: parsedDate,
        proofUrl: proofUrl ? proofUrl.trim() : null,
        status: "PENDING",
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Payment claim submitted successfully and is pending review.",
        claim,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Payment claim submission error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred while processing your claim." },
      { status: 500 }
    )
  }
}
