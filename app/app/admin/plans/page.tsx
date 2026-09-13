import Link from "next/link"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { verifyAdminSession } from "@/lib/admin-session"

export const dynamic = "force-dynamic"

function formatAmount(amount: any) {
  return `LKR ${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatStorage(quotaMb: number) {
  if (quotaMb >= 1024) {
    const gb = (quotaMb / 1024).toFixed(quotaMb % 1024 === 0 ? 0 : 1)
    return `${gb} GB (${quotaMb.toLocaleString()} MB)`
  }
  return `${quotaMb.toLocaleString()} MB`
}

export default async function AdminPlansPage() {
  const session = await verifyAdminSession()
  if (!session) {
    redirect("/app/admin/login")
  }

  const plans = await prisma.subscriptionPlan.findMany({
    include: {
      _count: {
        select: {
          subscriptions: true,
        },
      },
    },
    orderBy: {
      monthlyPrice: "asc",
    },
  })

  return (
    <div className="min-h-screen bg-mist-gray p-6 sm:p-10 font-sans text-ink-black">
      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div>
          <Link
            href="/app/admin"
            className="text-[15px] text-slate-gray hover:text-ink-black transition-colors inline-flex items-center gap-1.5"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Hero Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-[44px] font-serif font-normal text-ink-black tracking-[-0.66px] leading-[1.3]">
              Subscription Plans
            </h1>
            <p className="text-[17px] text-slate-gray mt-1">
              Configure tenant pricing tiers, resource allocations, and feature quotas.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/app/admin/orgs"
              className="text-[14px] font-medium px-3.5 py-2 rounded-[12px] bg-paper-white border border-[#ececec] text-slate-gray hover:text-ink-black hover:border-ink-black transition-colors"
            >
              Organizations
            </Link>
            <Link
              href="/app/admin/claims"
              className="text-[14px] font-medium px-3.5 py-2 rounded-[12px] bg-paper-white border border-[#ececec] text-slate-gray hover:text-ink-black hover:border-ink-black transition-colors"
            >
              Claims
            </Link>
            <Link
              href="/app/admin/audit-logs"
              className="text-[14px] font-medium px-3.5 py-2 rounded-[12px] bg-paper-white border border-[#ececec] text-slate-gray hover:text-ink-black hover:border-ink-black transition-colors"
            >
              Audit Logs
            </Link>
          </div>
        </div>

        {/* Plans Table Card */}
        <div className="bg-paper-white rounded-[24px] border border-[#ececec] shadow-subtle-3 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#f2f2f3]">
            <div>
              <h2 className="text-[20px] font-medium text-ink-black">Existing Plans</h2>
              <p className="text-[14px] text-slate-gray mt-0.5">
                Current active and inactive tiers available for tenant subscriptions
              </p>
            </div>
            <div className="text-[14px] font-medium text-slate-gray">
              {plans.length} {plans.length === 1 ? "plan configured" : "plans configured"}
            </div>
          </div>

          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ececec]">
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Plan Name
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Seats
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Branches
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Storage (MB)
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Price (LKR / mo)
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Status
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray text-right">
                    Subscribers
                  </th>
                </tr>
              </thead>
              <tbody>
                {plans.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[15px] text-slate-gray">
                      No subscription plans found. Create your first plan using the form below.
                    </td>
                  </tr>
                ) : (
                  plans.map((plan) => (
                    <tr
                      key={plan.id}
                      className="border-b border-[#f2f2f3] hover:bg-fog-white transition-colors"
                    >
                      <td className="py-4 px-4 font-medium text-[15px] text-ink-black">
                        {plan.name}
                      </td>
                      <td className="py-4 px-4 text-[14px] text-ink-black">
                        {plan.maxOfficerSeats} {plan.maxOfficerSeats === 1 ? "seat" : "seats"}
                      </td>
                      <td className="py-4 px-4 text-[14px] text-ink-black">
                        {plan.maxBranches} {plan.maxBranches === 1 ? "branch" : "branches"}
                      </td>
                      <td className="py-4 px-4 text-[14px] text-ink-black">
                        {formatStorage(plan.storageQuotaMb)}
                      </td>
                      <td className="py-4 px-4 font-medium text-[14px] text-ink-black">
                        {formatAmount(plan.monthlyPrice)}
                      </td>
                      <td className="py-4 px-4 text-[14px]">
                        {plan.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-[#e6f4ea] text-[#137333]">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-medium bg-mist-gray text-slate-gray">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-[14px] text-slate-gray text-right font-mono">
                        {plan._count.subscriptions}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Plan Form Card */}
        <div className="bg-paper-white rounded-[24px] border border-[#ececec] shadow-subtle-3 p-6 sm:p-8">
          <div className="pb-4 border-b border-[#f2f2f3]">
            <h2 className="text-[20px] font-medium text-ink-black">Create New Plan</h2>
            <p className="text-[14px] text-slate-gray mt-0.5">
              Specify officer limits, branch boundaries, storage allocation, and monthly billing amount
            </p>
          </div>

          <form
            id="create-plan-form"
            action="/api/admin/plans"
            method="POST"
            className="mt-6 space-y-6"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Plan Name */}
              <div className="flex flex-col gap-1.5 sm:col-span-2 lg:col-span-1">
                <label
                  htmlFor="plan-name"
                  className="text-[12px] uppercase tracking-wider text-ash-gray font-medium"
                >
                  Plan Name <span className="text-red-500">*</span>
                </label>
                <input
                  id="plan-name"
                  name="name"
                  type="text"
                  required
                  placeholder="e.g. Professional Tier"
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-4 py-2.5 text-[14px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black transition-colors"
                />
              </div>

              {/* Max Officer Seats */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="plan-seats"
                  className="text-[12px] uppercase tracking-wider text-ash-gray font-medium"
                >
                  Max Officer Seats <span className="text-red-500">*</span>
                </label>
                <input
                  id="plan-seats"
                  name="maxOfficerSeats"
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="e.g. 10"
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-4 py-2.5 text-[14px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black transition-colors"
                />
              </div>

              {/* Max Branches */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="plan-branches"
                  className="text-[12px] uppercase tracking-wider text-ash-gray font-medium"
                >
                  Max Branches <span className="text-red-500">*</span>
                </label>
                <input
                  id="plan-branches"
                  name="maxBranches"
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="e.g. 3"
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-4 py-2.5 text-[14px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black transition-colors"
                />
              </div>

              {/* Storage Quota (MB) */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="plan-storage"
                  className="text-[12px] uppercase tracking-wider text-ash-gray font-medium"
                >
                  Storage Quota (MB) <span className="text-red-500">*</span>
                </label>
                <input
                  id="plan-storage"
                  name="storageQuotaMb"
                  type="number"
                  min="1"
                  step="1"
                  required
                  placeholder="e.g. 2048 (2 GB)"
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-4 py-2.5 text-[14px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black transition-colors"
                />
                <span className="text-[11px] text-slate-gray">
                  1024 MB = 1 GB, 5120 MB = 5 GB
                </span>
              </div>

              {/* Monthly Price (LKR) */}
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="plan-price"
                  className="text-[12px] uppercase tracking-wider text-ash-gray font-medium"
                >
                  Monthly Price (LKR) <span className="text-red-500">*</span>
                </label>
                <input
                  id="plan-price"
                  name="monthlyPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  placeholder="e.g. 12500.00"
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-4 py-2.5 text-[14px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black transition-colors"
                />
                <span className="text-[11px] text-slate-gray">
                  Standard recurring fee per billing cycle
                </span>
              </div>

              {/* Is Active Toggle */}
              <div className="flex flex-col justify-center gap-1.5 pt-2">
                <label className="text-[12px] uppercase tracking-wider text-ash-gray font-medium">
                  Plan Availability
                </label>
                <label className="inline-flex items-center gap-2 cursor-pointer mt-1">
                  <input
                    id="plan-active"
                    name="isActive"
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded text-ink-black border-[#ececec] focus:ring-ink-black"
                  />
                  <span className="text-[14px] text-ink-black">Active (Available for tenant signups)</span>
                </label>
              </div>
            </div>

            {/* Status Feedback Message */}
            <div id="plan-form-feedback" className="hidden text-[14px] font-medium py-2"></div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#f2f2f3]">
              <button
                type="reset"
                className="px-5 py-2.5 rounded-[14px] text-[14px] font-medium text-slate-gray hover:text-ink-black hover:bg-fog-white transition-colors"
              >
                Reset
              </button>
              <button
                id="create-plan-submit-btn"
                type="submit"
                className="px-6 py-2.5 rounded-[14px] text-[14px] font-medium bg-ink-black text-paper-white hover:bg-[#2c2c2c] transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Plan
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Inline Script for AJAX Form Submission */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const form = document.getElementById('create-plan-form');
              const submitBtn = document.getElementById('create-plan-submit-btn');
              const feedback = document.getElementById('plan-form-feedback');

              if (!form) return;

              form.addEventListener('submit', async function(e) {
                e.preventDefault();

                const name = document.getElementById('plan-name')?.value?.trim();
                const maxOfficerSeats = document.getElementById('plan-seats')?.value;
                const maxBranches = document.getElementById('plan-branches')?.value;
                const storageQuotaMb = document.getElementById('plan-storage')?.value;
                const monthlyPrice = document.getElementById('plan-price')?.value;
                const isActive = document.getElementById('plan-active')?.checked;

                if (!name) {
                  showFeedback('Please enter a plan name.', 'error');
                  return;
                }

                if (submitBtn) {
                  submitBtn.disabled = true;
                  submitBtn.textContent = 'Creating Plan...';
                }
                showFeedback('Saving new subscription plan...', 'pending');

                try {
                  const res = await fetch('/api/admin/plans', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      name,
                      maxOfficerSeats: Number(maxOfficerSeats),
                      maxBranches: Number(maxBranches),
                      storageQuotaMb: Number(storageQuotaMb),
                      monthlyPrice: Number(monthlyPrice),
                      isActive: Boolean(isActive),
                    }),
                  });

                  const data = await res.json();
                  if (!res.ok) {
                    throw new Error(data.error || 'Failed to create plan');
                  }

                  showFeedback('Plan created successfully! Reloading page...', 'success');
                  form.reset();
                  setTimeout(function() {
                    window.location.reload();
                  }, 700);
                } catch (err) {
                  showFeedback(err.message || 'An error occurred while creating the plan', 'error');
                  if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Create Plan';
                  }
                }
              });

              function showFeedback(msg, type) {
                if (!feedback) return;
                feedback.classList.remove('hidden');
                feedback.textContent = msg;

                if (type === 'success') {
                  feedback.className = 'text-[14px] font-medium text-[#137333]';
                } else if (type === 'error') {
                  feedback.className = 'text-[14px] font-medium text-[#c5221f]';
                } else {
                  feedback.className = 'text-[14px] font-medium text-slate-gray';
                }
              }
            })();
          `,
        }}
      />
    </div>
  )
}
