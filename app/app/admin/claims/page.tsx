import Link from "next/link"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { verifyAdminSession } from "@/lib/admin-session"

export const dynamic = "force-dynamic"

function getStatusBadge(status: string) {
  switch (status) {
    case "PENDING":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#fbe1d1] text-[#5d2a1a]">
          Pending
        </span>
      )
    case "VERIFIED":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#e6f4ea] text-[#137333]">
          Verified
        </span>
      )
    case "REJECTED":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#fce8e6] text-[#c5221f]">
          Rejected
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-slate-50 text-slate-500">
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

export default async function AdminClaimsQueuePage() {
  const session = await verifyAdminSession()
  if (!session) {
    redirect("/app/admin/login")
  }

  const [pendingClaims, processedClaims] = await Promise.all([
    prisma.paymentClaim.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        subscription: {
          include: {
            organization: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        submittedAt: "desc",
      },
    }),
    prisma.paymentClaim.findMany({
      where: {
        status: {
          not: "PENDING",
        },
      },
      include: {
        subscription: {
          include: {
            organization: {
              select: {
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        verifiedAt: "desc",
      },
      take: 20,
    }),
  ])

  return (
    <div className="min-h-screen bg-slate-50 p-6 sm:p-10 font-sans text-navy-900">
      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/app/admin"
            className="text-[15px] text-slate-500 hover:text-navy-900 transition-colors inline-flex items-center gap-1.5"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Hero Header */}
        <div>
          <h1 className="text-[44px] font-serif font-normal text-navy-900 tracking-[-0.66px] leading-[1.3]">
            Payment Claims
          </h1>
          <p className="text-[17px] text-slate-500 mt-1">
            Verification queue for offline bank transfer subscription payments.
          </p>
        </div>

        {/* Pending Claims Section */}
        <div className="bg-white rounded-[24px] border border-[#ececec] shadow-subtle-3 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#f2f2f3]">
            <div>
              <h2 className="text-[20px] font-medium text-navy-900">Pending Verification Queue</h2>
              <p className="text-[14px] text-slate-500 mt-0.5">
                Claims requiring platform admin review and approval
              </p>
            </div>
            <div className="text-[14px] font-medium text-slate-500">
              {pendingClaims.length} {pendingClaims.length === 1 ? "claim pending" : "claims pending"}
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ececec]">
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-slate-400">
                    Org Name
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-slate-400">
                    Amount (LKR)
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-slate-400">
                    Bank Reference
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-slate-400">
                    Paid Date
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-slate-400">
                    Submitted At
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingClaims.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[15px] text-slate-500">
                      No pending payment claims waiting for verification. All caught up!
                    </td>
                  </tr>
                ) : (
                  pendingClaims.map((claim) => (
                    <tr
                      key={claim.id}
                      className="border-b border-[#f2f2f3] hover:bg-slate-100 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium text-[15px] text-navy-900">
                        {claim.subscription?.organization?.name || "Unknown Org"}
                      </td>
                      <td className="py-4 px-4 font-medium text-[15px] text-navy-900">
                        {formatAmount(claim.amount)}
                      </td>
                      <td className="py-4 px-4 font-mono text-[14px] text-slate-500">
                        {claim.bankReference}
                      </td>
                      <td className="py-4 px-4 text-[15px] text-slate-500">
                        {formatDate(claim.paidDate)}
                      </td>
                      <td className="py-4 px-4 text-[15px] text-slate-500">
                        {formatDateTime(claim.submittedAt)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/app/admin/claims/${claim.id}?action=approve`}
                            className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[13px] font-medium bg-[#e6f4ea] text-[#137333] hover:bg-[#d2ebd7] transition-colors"
                          >
                            Approve
                          </Link>
                          <Link
                            href={`/app/admin/claims/${claim.id}?action=reject`}
                            className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[13px] font-medium bg-[#fce8e6] text-[#c5221f] hover:bg-[#fad2cf] transition-colors"
                          >
                            Reject
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recently Processed Claims Section */}
        <div className="bg-white rounded-[24px] border border-[#ececec] shadow-subtle-3 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#f2f2f3]">
            <div>
              <h2 className="text-[20px] font-medium text-navy-900">Recently Processed Claims</h2>
              <p className="text-[14px] text-slate-500 mt-0.5">
                Last 20 verified or rejected payment claims, ordered by processed date
              </p>
            </div>
            <div className="text-[14px] font-medium text-slate-500">
              {processedClaims.length} {processedClaims.length === 1 ? "claim" : "claims"}
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ececec]">
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-slate-400">
                    Org Name
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-slate-400">
                    Amount (LKR)
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-slate-400">
                    Bank Reference
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-slate-400">
                    Status
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-slate-400">
                    Paid Date
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-slate-400">
                    Processed At
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-slate-400 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {processedClaims.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[15px] text-slate-500">
                      No processed payment claims recorded yet.
                    </td>
                  </tr>
                ) : (
                  processedClaims.map((claim) => (
                    <tr
                      key={claim.id}
                      className="border-b border-[#f2f2f3] hover:bg-slate-100 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium text-[15px] text-navy-900">
                        {claim.subscription?.organization?.name || "Unknown Org"}
                      </td>
                      <td className="py-4 px-4 font-medium text-[15px] text-navy-900">
                        {formatAmount(claim.amount)}
                      </td>
                      <td className="py-4 px-4 font-mono text-[14px] text-slate-500">
                        {claim.bankReference}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(claim.status)}
                      </td>
                      <td className="py-4 px-4 text-[15px] text-slate-500">
                        {formatDate(claim.paidDate)}
                      </td>
                      <td className="py-4 px-4 text-[15px] text-slate-500">
                        {formatDateTime(claim.verifiedAt)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/app/admin/claims/${claim.id}`}
                          className="inline-flex items-center gap-1 text-[13px] font-medium text-navy-900 hover:text-slate-500 transition-colors"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
