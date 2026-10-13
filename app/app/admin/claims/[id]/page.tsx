import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { verifyAdminSession } from "@/lib/admin-session"
import { ClaimActionForm } from "./components/claim-action-form"

export const dynamic = "force-dynamic"

interface PageProps {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<{
    action?: string
  }>
}

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[13px] font-medium bg-[#fbe1d1] text-[#5d2a1a]">
          Pending Verification
        </span>
      )
    case "VERIFIED":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[13px] font-medium bg-[#e6f4ea] text-[#137333]">
          Verified
        </span>
      )
    case "REJECTED":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[13px] font-medium bg-[#fce8e6] text-[#c5221f]">
          Rejected
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[13px] font-medium bg-slate-50 text-slate-500">
          {status}
        </span>
      )
  }
}

function formatDate(date?: Date | string | null) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

function formatDateTime(date?: Date | string | null) {
  if (!date) return "—"
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatAmount(amount: any) {
  return `LKR ${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export default async function ClaimDetailPage({ params, searchParams }: PageProps) {
  const session = await verifyAdminSession()
  if (!session) {
    redirect("/app/admin/login")
  }

  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const { id } = resolvedParams
  const initialAction = resolvedSearchParams?.action?.toUpperCase() === "REJECT" ? "REJECT" : "APPROVE"

  const claim = await prisma.paymentClaim.findUnique({
    where: { id },
    include: {
      subscription: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
            },
          },
          plan: {
            select: {
              id: true,
              name: true,
              monthlyPrice: true,
            },
          },
        },
      },
      verifiedBy: {
        select: {
          email: true,
        },
      },
    },
  })

  if (!claim) {
    notFound()
  }

  const org = claim.subscription?.organization
  const plan = claim.subscription?.plan
  const isPending = claim.status === "PENDING"

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10 font-sans text-navy-900">
      <div className="max-w-[1000px] mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/app/admin/claims"
            className="text-[15px] text-slate-500 hover:text-navy-900 transition-colors inline-flex items-center gap-1.5"
          >
            ← Back to Claims Queue
          </Link>
        </div>

        {/* Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[44px] font-serif font-normal text-navy-900 tracking-[-0.66px] leading-[1.3]">
              Claim Verification
            </h1>
            <p className="text-[17px] text-slate-500 mt-1">
              Payment claim details for{" "}
              {org ? (
                <Link
                  href={`/app/admin/orgs/${org.id}`}
                  className="font-medium text-navy-900 hover:underline"
                >
                  {org.name}
                </Link>
              ) : (
                "Unknown Organization"
              )}
            </p>
          </div>
          <div>{getStatusBadge(claim.status)}</div>
        </div>

        {/* Claim Information Card */}
        <div className="bg-white rounded-[24px] border border-[#ececec] shadow-subtle-3 p-6 sm:p-8">
          <h2 className="text-[20px] font-medium text-navy-900 pb-4 border-b border-[#f2f2f3]">
            Claim Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="text-[13px] font-medium uppercase tracking-wider text-slate-400 block">
                Organization
              </label>
              <div className="mt-1 text-[16px] font-medium text-navy-900">
                {org ? (
                  <Link
                    href={`/app/admin/orgs/${org.id}`}
                    className="hover:underline inline-flex items-center gap-1"
                  >
                    {org.name} →
                  </Link>
                ) : (
                  "—"
                )}
              </div>
            </div>

            <div>
              <label className="text-[13px] font-medium uppercase tracking-wider text-slate-400 block">
                Subscription Plan
              </label>
              <div className="mt-1 text-[16px] text-slate-500">
                {plan ? (
                  <span>
                    {plan.name} (LKR {Number(plan.monthlyPrice).toLocaleString()}/month)
                  </span>
                ) : (
                  "—"
                )}
              </div>
            </div>

            <div>
              <label className="text-[13px] font-medium uppercase tracking-wider text-slate-400 block">
                Claimed Amount
              </label>
              <div className="mt-1 text-[22px] font-medium text-navy-900">
                {formatAmount(claim.amount)}
              </div>
            </div>

            <div>
              <label className="text-[13px] font-medium uppercase tracking-wider text-slate-400 block">
                Bank Reference / Transaction ID
              </label>
              <div className="mt-1 text-[16px] font-mono text-navy-900 bg-slate-50/60 px-3 py-1.5 rounded-[10px] inline-block">
                {claim.bankReference}
              </div>
            </div>

            <div>
              <label className="text-[13px] font-medium uppercase tracking-wider text-slate-400 block">
                Paid Date (Reported Transfer Date)
              </label>
              <div className="mt-1 text-[16px] text-slate-500">
                {formatDate(claim.paidDate)}
              </div>
            </div>

            <div>
              <label className="text-[13px] font-medium uppercase tracking-wider text-slate-400 block">
                Submission Date
              </label>
              <div className="mt-1 text-[16px] text-slate-500">
                {formatDateTime(claim.submittedAt)}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[13px] font-medium uppercase tracking-wider text-slate-400 block">
                Deposit Proof Slip / Document
              </label>
                <div className="mt-2">
                  {claim.proofUrl ? (
                    <div className="space-y-4">
                      {/* Check if it's likely an image by extension */}
                      {/\.(jpg|jpeg|png|webp|gif|bmp)$/i.test(claim.proofUrl) ? (
                        <div className="overflow-hidden rounded-[12px] border border-[#ececec] max-w-lg bg-gray-50 flex justify-center">
                          <img
                            src={claim.proofUrl}
                            alt="Deposit Proof"
                            loading="lazy"
                            decoding="async"
                            className="max-h-[400px] w-auto object-contain"
                          />
                        </div>
                      ) : null}
                      <a
                        href={claim.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#ececec] text-[14px] font-medium text-navy-900 hover:bg-slate-100 transition-colors"
                      >
                        <span>Open Document (New Tab)</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  ) : (
                    <span className="text-[15px] text-slate-500 italic">
                      No proof document uploaded with this claim.
                    </span>
                  )}
                </div>
            </div>
          </div>
        </div>

        {/* If Already Processed: Resolution Details */}
        {!isPending && (
          <div className="bg-white rounded-[24px] border border-[#ececec] shadow-subtle-3 p-6 sm:p-8">
            <h2 className="text-[20px] font-medium text-navy-900 pb-4 border-b border-[#f2f2f3]">
              Resolution Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="text-[13px] font-medium uppercase tracking-wider text-slate-400 block">
                  Final Status
                </label>
                <div className="mt-1">{getStatusBadge(claim.status)}</div>
              </div>

              <div>
                <label className="text-[13px] font-medium uppercase tracking-wider text-slate-400 block">
                  Verified / Reviewed At
                </label>
                <div className="mt-1 text-[15px] text-slate-500">
                  {formatDateTime(claim.verifiedAt)}
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium uppercase tracking-wider text-slate-400 block">
                  Processed By Admin
                </label>
                <div className="mt-1 text-[15px] text-slate-500">
                  {claim.verifiedBy?.email || "Platform Admin"}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[13px] font-medium uppercase tracking-wider text-slate-400 block">
                  Verification Note / Reason
                </label>
                <div className="mt-1 p-4 rounded-[16px] bg-slate-50 text-[15px] text-navy-900 whitespace-pre-wrap">
                  {claim.reviewNote || "No note recorded."}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* If Pending: Action Form */}
        {isPending && (
          <ClaimActionForm
            claimId={claim.id}
            initialAction={initialAction}
            initialError={resolvedSearchParams?.error}
          />
        )}
      </div>

  )
}
