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

    const formData = await req.formData()
    const amount = formData.get("amount") as string
    const bankReference = formData.get("bankReference") as string
    const paidDate = formData.get("paidDate") as string
    const file = formData.get("proofFile") as File | null

    let finalProofUrl = null

    if (file && file.size > 0) {
      const { supabase } = await import("@/lib/supabase")
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      const fileName = `claims/${organizationId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
      
      const { data, error } = await supabase.storage
        .from("claims")
        .upload(fileName, buffer, {
          contentType: file.type || "application/octet-stream",
          upsert: true,
        })

      if (error) {
        console.error("Supabase upload error:", error)
        throw new Error("Failed to upload document to storage")
      }

      const { data: publicUrlData } = supabase.storage
        .from("claims")
        .getPublicUrl(fileName)

      finalProofUrl = publicUrlData.publicUrl
    }

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
        proofUrl: finalProofUrl,
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
