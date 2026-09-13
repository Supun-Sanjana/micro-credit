import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { verifyAdminSession } from "@/lib/admin-session"

export const dynamic = "force-dynamic"

interface PageProps {
  params: {
    id: string
  }
  searchParams?: {
    action?: string
  }
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
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[13px] font-medium bg-mist-gray text-slate-gray">
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
    redirect(/app/admin/login")
  }

  const { id } = params
  const initialAction = searchParams?.action?.toUpperCase() === "REJECT" ? "REJECT" : "APPROVE"

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
    <div className="min-h-screen bg-mist-gray p-6 sm:p-10 font-sans text-ink-black">
      <div className="max-w-[1000px] mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href=/app/admin/claims"
            className="text-[15px] text-slate-gray hover:text-ink-black transition-colors inline-flex items-center gap-1.5"
          >
            ← Back to Claims Queue
          </Link>
        </div>

        {/* Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[44px] font-serif font-normal text-ink-black tracking-[-0.66px] leading-[1.3]">
              Claim Verification
            </h1>
            <p className="text-[17px] text-slate-gray mt-1">
              Payment claim details for{" "}
              {org ? (
                <Link
                  href={`/admin/orgs/${org.id}`}
                  className="font-medium text-ink-black hover:underline"
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
        <div className="bg-paper-white rounded-[24px] border border-[#ececec] shadow-subtle-3 p-6 sm:p-8">
          <h2 className="text-[20px] font-medium text-ink-black pb-4 border-b border-[#f2f2f3]">
            Claim Details
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
            <div>
              <label className="text-[13px] font-medium uppercase tracking-wider text-ash-gray block">
                Organization
              </label>
              <div className="mt-1 text-[16px] font-medium text-ink-black">
                {org ? (
                  <Link
                    href={`/admin/orgs/${org.id}`}
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
              <label className="text-[13px] font-medium uppercase tracking-wider text-ash-gray block">
                Subscription Plan
              </label>
              <div className="mt-1 text-[16px] text-slate-gray">
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
              <label className="text-[13px] font-medium uppercase tracking-wider text-ash-gray block">
                Claimed Amount
              </label>
              <div className="mt-1 text-[22px] font-medium text-ink-black">
                {formatAmount(claim.amount)}
              </div>
            </div>

            <div>
              <label className="text-[13px] font-medium uppercase tracking-wider text-ash-gray block">
                Bank Reference / Transaction ID
              </label>
              <div className="mt-1 text-[16px] font-mono text-ink-black bg-mist-gray/60 px-3 py-1.5 rounded-[10px] inline-block">
                {claim.bankReference}
              </div>
            </div>

            <div>
              <label className="text-[13px] font-medium uppercase tracking-wider text-ash-gray block">
                Paid Date (Reported Transfer Date)
              </label>
              <div className="mt-1 text-[16px] text-slate-gray">
                {formatDate(claim.paidDate)}
              </div>
            </div>

            <div>
              <label className="text-[13px] font-medium uppercase tracking-wider text-ash-gray block">
                Submission Date
              </label>
              <div className="mt-1 text-[16px] text-slate-gray">
                {formatDateTime(claim.submittedAt)}
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[13px] font-medium uppercase tracking-wider text-ash-gray block">
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
                            className="max-h-[400px] w-auto object-contain"
                          />
                        </div>
                      ) : null}
                      <a
                        href={claim.proofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#ececec] text-[14px] font-medium text-ink-black hover:bg-fog-white transition-colors"
                      >
                        <span>Open Document (New Tab)</span>
                        <span aria-hidden="true">↗</span>
                      </a>
                    </div>
                  ) : (
                    <span className="text-[15px] text-slate-gray italic">
                      No proof document uploaded with this claim.
                    </span>
                  )}
                </div>
            </div>
          </div>
        </div>

        {/* If Already Processed: Resolution Details */}
        {!isPending && (
          <div className="bg-paper-white rounded-[24px] border border-[#ececec] shadow-subtle-3 p-6 sm:p-8">
            <h2 className="text-[20px] font-medium text-ink-black pb-4 border-b border-[#f2f2f3]">
              Resolution Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-6">
              <div>
                <label className="text-[13px] font-medium uppercase tracking-wider text-ash-gray block">
                  Final Status
                </label>
                <div className="mt-1">{getStatusBadge(claim.status)}</div>
              </div>

              <div>
                <label className="text-[13px] font-medium uppercase tracking-wider text-ash-gray block">
                  Verified / Reviewed At
                </label>
                <div className="mt-1 text-[15px] text-slate-gray">
                  {formatDateTime(claim.verifiedAt)}
                </div>
              </div>

              <div>
                <label className="text-[13px] font-medium uppercase tracking-wider text-ash-gray block">
                  Processed By Admin
                </label>
                <div className="mt-1 text-[15px] text-slate-gray">
                  {claim.verifiedBy?.email || "Platform Admin"}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[13px] font-medium uppercase tracking-wider text-ash-gray block">
                  Verification Note / Reason
                </label>
                <div className="mt-1 p-4 rounded-[16px] bg-mist-gray text-[15px] text-ink-black whitespace-pre-wrap">
                  {claim.reviewNote || "No note recorded."}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* If Pending: Action Form */}
        {isPending && (
          <div className="bg-paper-white rounded-[24px] border border-[#ececec] shadow-subtle-3 p-6 sm:p-8">
            <div className="pb-4 border-b border-[#f2f2f3]">
              <h2 className="text-[20px] font-medium text-ink-black">Verification Action</h2>
              <p className="text-[14px] text-slate-gray mt-0.5">
                Verify this payment claim to activate subscription, or reject if invalid.
              </p>
            </div>

            <form
              id="claim-action-form"
              method="POST"
              action={`/api/admin/claims/${claim.id}/action`}
              className="space-y-6 mt-6"
            >
              {/* Radio options */}
              <div>
                <label className="text-[13px] font-medium uppercase tracking-wider text-ash-gray block mb-3">
                  Select Action
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label
                    id="action-label-approve"
                    className="flex items-start gap-3 p-4 rounded-[16px] border border-[#ececec] cursor-pointer hover:border-ink-black transition-colors"
                  >
                    <input
                      type="radio"
                      name="action"
                      value="APPROVE"
                      defaultChecked={initialAction === "APPROVE"}
                      className="mt-1 h-4 w-4 text-ink-black focus:ring-ink-black"
                    />
                    <div>
                      <div className="text-[15px] font-medium text-ink-black">
                        Approve Claim
                      </div>
                      <p className="text-[13px] text-slate-gray mt-0.5">
                        Marks claim as VERIFIED, activates organization subscription to ACTIVE, and sets current period end to 30 days from now.
                      </p>
                    </div>
                  </label>

                  <label
                    id="action-label-reject"
                    className="flex items-start gap-3 p-4 rounded-[16px] border border-[#ececec] cursor-pointer hover:border-ink-black transition-colors"
                  >
                    <input
                      type="radio"
                      name="action"
                      value="REJECT"
                      defaultChecked={initialAction === "REJECT"}
                      className="mt-1 h-4 w-4 text-ink-black focus:ring-ink-black"
                    />
                    <div>
                      <div className="text-[15px] font-medium text-ink-black">
                        Reject Claim
                      </div>
                      <p className="text-[13px] text-slate-gray mt-0.5">
                        Marks claim as REJECTED. Subscription status is not changed. Requires a verification note.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {/* Note Textarea */}
              <div>
                <label
                  htmlFor="claim-note"
                  className="text-[14px] font-medium text-ink-black block mb-1.5"
                >
                  Verification Note — required on reject, recommended on approve
                </label>
                <textarea
                  id="claim-note"
                  name="note"
                  rows={4}
                  placeholder="e.g. Verified deposit with Commercial Bank statement reference #123456... or Invalid slip photo..."
                  className="w-full bg-paper-white border border-[#ececec] rounded-[16px] p-3.5 text-[15px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black transition-colors"
                />
              </div>

              {/* Submit Button & Feedback */}
              <div className="pt-2">
                <button
                  id="claim-submit-btn"
                  type="submit"
                  className="rounded-full bg-ink-black text-paper-white px-6 py-2.5 text-[15px] font-medium hover:bg-opacity-90 transition-opacity"
                >
                  Submit Decision
                </button>
                <div id="claim-feedback" className="hidden mt-4 p-4 rounded-[16px] text-[14px]" />
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Interactive AJAX Submission Script */}
      {isPending && (
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const form = document.getElementById('claim-action-form');
                const submitBtn = document.getElementById('claim-submit-btn');
                const feedback = document.getElementById('claim-feedback');
                const noteInput = document.getElementById('claim-note');

                if (!form) return;

                form.addEventListener('submit', async function(e) {
                  e.preventDefault();

                  const actionInputs = form.querySelectorAll('input[name="action"]');
                  let selectedAction = 'APPROVE';
                  actionInputs.forEach(function(radio) {
                    if (radio.checked) selectedAction = radio.value;
                  });

                  const note = noteInput ? noteInput.value.trim() : '';

                  if (selectedAction === 'REJECT' && !note) {
                    if (feedback) {
                      feedback.className = 'mt-4 p-4 rounded-[16px] text-[14px] bg-[#fce8e6] text-[#c5221f] font-medium';
                      feedback.textContent = 'A verification note is required when rejecting a payment claim.';
                      feedback.classList.remove('hidden');
                    }
                    if (noteInput) noteInput.focus();
                    return;
                  }

                  if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Processing...';
                  }

                  if (feedback) {
                    feedback.className = 'mt-4 p-4 rounded-[16px] text-[14px] bg-mist-gray text-slate-gray font-medium';
                    feedback.textContent = 'Submitting decision...';
                    feedback.classList.remove('hidden');
                  }

                  try {
                    const res = await fetch('/api/admin/claims/${claim.id}/action', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        action: selectedAction,
                        note: note || undefined,
                      }),
                    });

                    const data = await res.json();

                    if (!res.ok) {
                      if (res.status === 409) {
                        throw new Error('Claim already processed (409 Conflict). Reloading...');
                      }
                      throw new Error(data.error || 'Failed to submit verification action');
                    }

                    if (feedback) {
                      feedback.className = 'mt-4 p-4 rounded-[16px] text-[14px] bg-[#e6f4ea] text-[#137333] font-medium';
                      feedback.textContent = 'Payment claim successfully ' + (selectedAction === 'APPROVE' ? 'approved' : 'rejected') + '! Redirecting to queue...';
                    }

                    setTimeout(function() {
                      window.location.href = /app/admin/claims';
                    }, 1000);
                  } catch (err) {
                    if (feedback) {
                      feedback.className = 'mt-4 p-4 rounded-[16px] text-[14px] bg-[#fce8e6] text-[#c5221f] font-medium';
                      feedback.textContent = err.message || 'An error occurred';
                    }
                    if (submitBtn) {
                      submitBtn.disabled = false;
                      submitBtn.textContent = 'Submit Decision';
                    }
                    if (err.message && err.message.includes('409')) {
                      setTimeout(function() {
                        window.location.reload();
                      }, 1500);
                    }
                  }
                });
              })();
            `,
          }}
        />
      )}
    </div>
  )
}
