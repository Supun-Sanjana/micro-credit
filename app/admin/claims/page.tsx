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
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-mist-gray text-slate-gray">
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
    redirect("/admin/login")
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
    <div className="min-h-screen bg-mist-gray p-6 sm:p-10 font-sans text-ink-black">
      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/admin"
            className="text-[15px] text-slate-gray hover:text-ink-black transition-colors inline-flex items-center gap-1.5"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Hero Header */}
        <div>
          <h1 className="text-[44px] font-serif font-normal text-ink-black tracking-[-0.66px] leading-[1.3]">
            Payment Claims
          </h1>
          <p className="text-[17px] text-slate-gray mt-1">
            Verification queue for offline bank transfer subscription payments.
          </p>
        </div>

        {/* Pending Claims Section */}
        <div className="bg-paper-white rounded-[24px] border border-[#ececec] shadow-subtle-3 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#f2f2f3]">
            <div>
              <h2 className="text-[20px] font-medium text-ink-black">Pending Verification Queue</h2>
              <p className="text-[14px] text-slate-gray mt-0.5">
                Claims requiring platform admin review and approval
              </p>
            </div>
            <div className="text-[14px] font-medium text-slate-gray">
              {pendingClaims.length} {pendingClaims.length === 1 ? "claim pending" : "claims pending"}
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ececec]">
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Org Name
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Amount (LKR)
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Bank Reference
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Paid Date
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Submitted At
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingClaims.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[15px] text-slate-gray">
                      No pending payment claims waiting for verification. All caught up!
                    </td>
                  </tr>
                ) : (
                  pendingClaims.map((claim) => (
                    <tr
                      key={claim.id}
                      className="border-b border-[#f2f2f3] hover:bg-fog-white transition-colors"
                    >
                      <td className="py-4 px-4 font-medium text-[15px] text-ink-black">
                        {claim.subscription?.organization?.name || "Unknown Org"}
                      </td>
                      <td className="py-4 px-4 font-medium text-[15px] text-ink-black">
                        {formatAmount(claim.amount)}
                      </td>
                      <td className="py-4 px-4 font-mono text-[14px] text-slate-gray">
                        {claim.bankReference}
                      </td>
                      <td className="py-4 px-4 text-[15px] text-slate-gray">
                        {formatDate(claim.paidDate)}
                      </td>
                      <td className="py-4 px-4 text-[15px] text-slate-gray">
                        {formatDateTime(claim.submittedAt)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/claims/${claim.id}?action=approve`}
                            className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-[13px] font-medium bg-[#e6f4ea] text-[#137333] hover:bg-[#d2ebd7] transition-colors"
                          >
                            Approve
                          </Link>
                          <Link
                            href={`/admin/claims/${claim.id}?action=reject`}
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
        <div className="bg-paper-white rounded-[24px] border border-[#ececec] shadow-subtle-3 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#f2f2f3]">
            <div>
              <h2 className="text-[20px] font-medium text-ink-black">Recently Processed Claims</h2>
              <p className="text-[14px] text-slate-gray mt-0.5">
                Last 20 verified or rejected payment claims, ordered by processed date
              </p>
            </div>
            <div className="text-[14px] font-medium text-slate-gray">
              {processedClaims.length} {processedClaims.length === 1 ? "claim" : "claims"}
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ececec]">
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Org Name
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Amount (LKR)
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Bank Reference
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Status
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Paid Date
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Processed At
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {processedClaims.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[15px] text-slate-gray">
                      No processed payment claims recorded yet.
                    </td>
                  </tr>
                ) : (
                  processedClaims.map((claim) => (
                    <tr
                      key={claim.id}
                      className="border-b border-[#f2f2f3] hover:bg-fog-white transition-colors"
                    >
                      <td className="py-4 px-4 font-medium text-[15px] text-ink-black">
                        {claim.subscription?.organization?.name || "Unknown Org"}
                      </td>
                      <td className="py-4 px-4 font-medium text-[15px] text-ink-black">
                        {formatAmount(claim.amount)}
                      </td>
                      <td className="py-4 px-4 font-mono text-[14px] text-slate-gray">
                        {claim.bankReference}
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(claim.status)}
                      </td>
                      <td className="py-4 px-4 text-[15px] text-slate-gray">
                        {formatDate(claim.paidDate)}
                      </td>
                      <td className="py-4 px-4 text-[15px] text-slate-gray">
                        {formatDateTime(claim.verifiedAt)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <Link
                          href={`/admin/claims/${claim.id}`}
                          className="inline-flex items-center gap-1 text-[13px] font-medium text-ink-black hover:text-slate-gray transition-colors"
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
