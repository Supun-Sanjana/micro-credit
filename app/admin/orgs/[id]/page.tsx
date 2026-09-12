import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { verifyAdminSession } from "@/lib/admin-session"

export const dynamic = "force-dynamic"

interface PageProps {
  params: {
    id: string
  }
}

function getStatusBadge(status?: string | null) {
  if (!status) {
    return (
      <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-mist-gray text-slate-gray">
        No Plan
      </span>
    )
  }

  switch (status) {
    case "TRIAL":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-[#fbe1d1] text-[#5d2a1a]">
          Trial
        </span>
      )
    case "ACTIVE":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-[#e6f4ea] text-[#137333]">
          Active
        </span>
      )
    case "SUSPENDED":
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-[#fce8e6] text-[#c5221f]">
          Suspended
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[12px] font-medium bg-mist-gray text-slate-gray">
          {status.replace(/_/g, " ")}
        </span>
      )
  }
}

function getClaimStatusBadge(status: string) {
  switch (status) {
    case "VERIFIED":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#e6f4ea] text-[#137333]">
          Verified
        </span>
      )
    case "PENDING":
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#fbe1d1] text-[#5d2a1a]">
          Pending
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

export default async function OrgDetailPage({ params }: PageProps) {
  const session = await verifyAdminSession()
  if (!session) {
    redirect("/admin/login")
  }

  const { id } = params

  const [org, storageAggregate] = await Promise.all([
    prisma.organization.findUnique({
      where: { id },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        subscription: {
          include: {
            plan: true,
            paymentClaims: {
              orderBy: { submittedAt: "desc" },
            },
          },
        },
      },
    }),
    prisma.memberDocument.aggregate({
      where: { organizationId: id },
      _sum: {
        sizeBytes: true,
      },
    }),
  ])

  if (!org) {
    notFound()
  }

  const subscription = org.subscription
  const plan = subscription?.plan
  const paymentClaims = subscription?.paymentClaims || []

  // Storage calculations
  const totalBytes = storageAggregate._sum.sizeBytes ?? 0
  const totalMb = parseFloat((totalBytes / (1024 * 1024)).toFixed(2))
  const storageQuotaMb = plan?.storageQuotaMb ?? 0
  const storagePercent =
    storageQuotaMb > 0
      ? Math.min(100, Math.round((totalMb / storageQuotaMb) * 100))
      : 0

  // Date formatters
  const formatDate = (date?: Date | null) => {
    if (!date) return "—"
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen bg-mist-gray p-6 sm:p-10 font-sans text-ink-black">
      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/admin/orgs"
            className="text-[15px] text-slate-gray hover:text-ink-black transition-colors inline-flex items-center gap-1.5"
          >
            ← Back to Organizations
          </Link>
        </div>

        {/* Hero Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-[44px] font-serif font-normal text-ink-black tracking-[-0.66px] leading-[1.3]">
                {org.name}
              </h1>
              {getStatusBadge(subscription?.status)}
            </div>
            <p className="text-[15px] text-slate-gray mt-1">
              Created on {formatDate(org.createdAt)} • Organization ID:{" "}
              <span className="font-mono text-[13px]">{org.id}</span>
            </p>
          </div>
        </div>

        {/* Top Grid: Subscription Details & Storage Quota */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Subscription Card */}
          <div className="md:col-span-2 bg-paper-white rounded-[24px] border border-[#ececec] shadow-subtle-3 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#f2f2f3]">
                <div>
                  <h2 className="text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Subscription & Tier
                  </h2>
                  <p className="text-[20px] font-medium text-ink-black mt-1">
                    {plan?.name || "No Plan Assigned"}
                  </p>
                </div>
                {plan?.monthlyPrice && (
                  <div className="text-right">
                    <span className="text-[13px] text-ash-gray uppercase tracking-wider">Price</span>
                    <p className="text-[18px] font-medium text-ink-black">
                      LKR {Number(plan.monthlyPrice).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      <span className="text-[13px] font-normal text-slate-gray"> / mo</span>
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div>
                  <span className="text-[12px] uppercase tracking-wider text-ash-gray">Status</span>
                  <div className="mt-1.5">{getStatusBadge(subscription?.status)}</div>
                </div>
                <div>
                  <span className="text-[12px] uppercase tracking-wider text-ash-gray">Trial Ends</span>
                  <p className="text-[15px] text-ink-black mt-1.5 font-medium">
                    {formatDate(subscription?.trialEndsAt)}
                  </p>
                </div>
                <div>
                  <span className="text-[12px] uppercase tracking-wider text-ash-gray">Period End</span>
                  <p className="text-[15px] text-ink-black mt-1.5 font-medium">
                    {formatDate(subscription?.currentPeriodEnd)}
                  </p>
                </div>
                <div>
                  <span className="text-[12px] uppercase tracking-wider text-ash-gray">Branch Limit</span>
                  <p className="text-[15px] text-ink-black mt-1.5 font-medium">
                    {plan?.maxBranches ? `${plan.maxBranches} branches` : "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Storage Quota Progress Bar */}
            <div className="mt-8 pt-6 border-t border-[#f2f2f3]">
              <div className="flex items-center justify-between text-[14px] mb-2">
                <span className="text-slate-gray font-medium">Storage Quota</span>
                <span className="text-ink-black font-medium">
                  {totalMb} MB of {storageQuotaMb > 0 ? `${storageQuotaMb} MB` : "No limit"} ({storagePercent}%)
                </span>
              </div>
              <div className="w-full bg-mist-gray rounded-full h-3 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    storagePercent >= 90 ? "bg-red-600" : "bg-ink-black"
                  }`}
                  style={{ width: `${storagePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Override Form Card */}
          <div className="bg-paper-white rounded-[24px] border border-[#ececec] shadow-subtle-3 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <h2 className="text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                Status Override
              </h2>
              <p className="text-[14px] text-slate-gray mt-1">
                Admin manual status switch. Action is recorded in platform audit logs.
              </p>

              <form
                id="override-form"
                action={`/api/admin/orgs/${org.id}/override`}
                method="POST"
                className="mt-6 flex flex-col gap-4"
              >
                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] uppercase tracking-wider text-ash-gray">
                    Target Status
                  </label>
                  <select
                    id="override-status-select"
                    name="status"
                    defaultValue={subscription?.status || "TRIAL"}
                    className="bg-paper-white border border-[#ececec] rounded-[16px] px-4 py-2.5 text-[14px] text-ink-black outline-none focus:border-ink-black transition-colors"
                  >
                    <option value="TRIAL">TRIAL</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="SUSPENDED">SUSPENDED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="GRACE_PERIOD">GRACE_PERIOD</option>
                    <option value="PENDING_VERIFICATION">PENDING_VERIFICATION</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[12px] uppercase tracking-wider text-ash-gray">
                    Audit Note
                  </label>
                  <textarea
                    id="override-note-input"
                    name="note"
                    rows={2}
                    placeholder="Reason for override (optional)..."
                    className="bg-paper-white border border-[#ececec] rounded-[16px] px-4 py-2.5 text-[14px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  id="override-submit-btn"
                  className="mt-2 w-full rounded-full bg-ink-black text-paper-white px-5 py-2.5 text-[14px] font-medium transition hover:opacity-90 disabled:opacity-50"
                >
                  Apply Override
                </button>

                <p id="override-feedback" className="text-[13px] font-medium text-center hidden"></p>
              </form>
            </div>
          </div>
        </div>

        {/* Users Section */}
        <div className="bg-paper-white rounded-[24px] border border-[#ececec] shadow-subtle-3 p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-[#f2f2f3]">
            <div>
              <h2 className="text-[20px] font-medium text-ink-black">Organization Users</h2>
              <p className="text-[14px] text-slate-gray mt-0.5">
                Staff and administrators belonging to this tenant ({org.users.length} total)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ececec]">
                  <th className="py-3 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Name
                  </th>
                  <th className="py-3 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Email
                  </th>
                  <th className="py-3 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Role
                  </th>
                  <th className="py-3 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray text-right">
                    Joined Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {org.users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[15px] text-slate-gray">
                      No users registered in this organization.
                    </td>
                  </tr>
                ) : (
                  org.users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-[#f2f2f3] hover:bg-fog-white transition-colors"
                    >
                      <td className="py-3.5 px-4 text-[15px] font-medium text-ink-black">
                        {u.name || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-[15px] text-slate-gray">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium ${
                            u.role === "ADMIN"
                              ? "bg-ink-black text-paper-white"
                              : "bg-mist-gray text-slate-gray"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-[15px] text-slate-gray text-right">
                        {formatDate(u.createdAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Claims Section */}
        <div className="bg-paper-white rounded-[24px] border border-[#ececec] shadow-subtle-3 p-6 sm:p-8">
          <div className="flex items-center justify-between pb-4 border-b border-[#f2f2f3]">
            <div>
              <h2 className="text-[20px] font-medium text-ink-black">Payment Claims</h2>
              <p className="text-[14px] text-slate-gray mt-0.5">
                Bank transfer claims and payment verifications ({paymentClaims.length} total)
              </p>
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ececec]">
                  <th className="py-3 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Amount
                  </th>
                  <th className="py-3 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Bank Reference
                  </th>
                  <th className="py-3 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Status
                  </th>
                  <th className="py-3 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray text-right">
                    Submitted At
                  </th>
                </tr>
              </thead>
              <tbody>
                {paymentClaims.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[15px] text-slate-gray">
                      No payment claims recorded for this subscription.
                    </td>
                  </tr>
                ) : (
                  paymentClaims.map((claim) => (
                    <tr
                      key={claim.id}
                      className="border-b border-[#f2f2f3] hover:bg-fog-white transition-colors"
                    >
                      <td className="py-3.5 px-4 text-[15px] font-medium text-ink-black">
                        LKR {Number(claim.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-4 text-[15px] font-mono text-slate-gray">
                        {claim.bankReference}
                      </td>
                      <td className="py-3.5 px-4">
                        {getClaimStatusBadge(claim.status)}
                      </td>
                      <td className="py-3.5 px-4 text-[15px] text-slate-gray text-right">
                        {formatDate(claim.submittedAt)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Inline Script for AJAX Form Submission */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const form = document.getElementById('override-form');
              const submitBtn = document.getElementById('override-submit-btn');
              const feedback = document.getElementById('override-feedback');

              if (!form) return;

              form.addEventListener('submit', async function(e) {
                e.preventDefault();
                const status = document.getElementById('override-status-select')?.value;
                const note = document.getElementById('override-note-input')?.value;

                if (submitBtn) {
                  submitBtn.disabled = true;
                  submitBtn.textContent = 'Saving...';
                }
                if (feedback) {
                  feedback.className = 'text-[13px] font-medium text-slate-gray text-center';
                  feedback.textContent = 'Updating status...';
                  feedback.classList.remove('hidden');
                }

                try {
                  const res = await fetch('/api/admin/orgs/${org.id}/override', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ status, note: note || undefined }),
                  });

                  const data = await res.json();
                  if (!res.ok) {
                    throw new Error(data.error || 'Failed to update subscription status');
                  }

                  if (feedback) {
                    feedback.className = 'text-[13px] font-medium text-[#137333] text-center';
                    feedback.textContent = 'Status overridden successfully. Refreshing...';
                  }
                  setTimeout(function() {
                    window.location.reload();
                  }, 800);
                } catch (err) {
                  if (feedback) {
                    feedback.className = 'text-[13px] font-medium text-[#c5221f] text-center';
                    feedback.textContent = err.message || 'Error updating status';
                  }
                  if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Apply Override';
                  }
                }
              });
            })();
          `,
        }}
      />
    </div>
  )
}
