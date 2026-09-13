import Link from "next/link"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { verifyAdminSession } from "@/lib/admin-session"

export const dynamic = "force-dynamic"

function formatDateTime(date?: Date | string | null) {
  if (!date) return "—"
  return new Date(date).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

function getActionBadge(action: string) {
  const upper = action.toUpperCase()
  if (upper.includes("APPROVE") || upper.includes("ACTIVE")) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-mono font-medium bg-[#e6f4ea] text-[#137333]">
        {action}
      </span>
    )
  }
  if (upper.includes("REJECT") || upper.includes("SUSPEND")) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-mono font-medium bg-[#fce8e6] text-[#c5221f]">
        {action}
      </span>
    )
  }
  if (upper.includes("OVERRIDE") || upper.includes("UPDATE")) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-mono font-medium bg-[#fbe1d1] text-[#5d2a1a]">
        {action}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-mono font-medium bg-[#eef2f6] text-[#1e293b]">
      {action}
    </span>
  )
}

function getTargetBadge(targetType: string) {
  switch (targetType) {
    case "Organization":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-mist-gray text-slate-gray">
          Organization
        </span>
      )
    case "PaymentClaim":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#f0ecfc] text-[#4a2bb3]">
          PaymentClaim
        </span>
      )
    case "SubscriptionPlan":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#e4f2ff] text-[#0055b3]">
          Plan
        </span>
      )
    case "User":
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#fef3c7] text-[#92400e]">
          User
        </span>
      )
    default:
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-mist-gray text-slate-gray">
          {targetType}
        </span>
      )
  }
}

export default async function AdminAuditLogsPage() {
  const session = await verifyAdminSession()
  if (!session) {
    redirect("/app/admin/login")
  }

  const auditLogs = await prisma.platformAdminAuditLog.findMany({
    include: {
      platformAdmin: {
        select: {
          id: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
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
              Platform Audit Logs
            </h1>
            <p className="text-[17px] text-slate-gray mt-1">
              Immutable traceability record of administrative operations across the platform.
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
              href="/app/admin/plans"
              className="text-[14px] font-medium px-3.5 py-2 rounded-[12px] bg-paper-white border border-[#ececec] text-slate-gray hover:text-ink-black hover:border-ink-black transition-colors"
            >
              Plans
            </Link>
          </div>
        </div>

        {/* Main Content Card */}
        <div className="bg-paper-white rounded-[24px] border border-[#ececec] shadow-subtle-3 p-6 sm:p-8">
          {/* Search Bar & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#f2f2f3]">
            <div className="relative w-full max-w-sm">
              <input
                id="audit-search-input"
                type="text"
                placeholder="Filter by action, admin, target, or note..."
                className="w-full bg-paper-white border border-[#ececec] rounded-[16px] px-4 py-2.5 text-[15px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black transition-colors"
              />
            </div>
            <div id="audit-count-display" className="text-[14px] text-slate-gray font-medium">
              {auditLogs.length} {auditLogs.length === 1 ? "audit entry" : "audit entries"}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ececec]">
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Date & Time
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Admin
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Action
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Target
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody id="audit-table-body">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[15px] text-slate-gray">
                      No audit log records found.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => {
                    const searchData = `${log.action} ${log.platformAdmin?.email || ""} ${log.targetType} ${log.targetId} ${log.note || ""}`.toLowerCase()
                    return (
                      <tr
                        key={log.id}
                        data-search={searchData}
                        className="audit-table-row border-b border-[#f2f2f3] hover:bg-fog-white transition-colors"
                      >
                        <td className="py-4 px-4 text-[14px] text-slate-gray whitespace-nowrap">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="py-4 px-4 text-[14px] font-medium text-ink-black">
                          {log.platformAdmin?.email || "System"}
                        </td>
                        <td className="py-4 px-4 text-[14px]">
                          {getActionBadge(log.action)}
                        </td>
                        <td className="py-4 px-4 text-[14px]">
                          <div className="flex flex-col gap-0.5">
                            <div>{getTargetBadge(log.targetType)}</div>
                            <span className="font-mono text-[12px] text-slate-gray">
                              {log.targetId}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-[14px] text-slate-gray max-w-md break-words">
                          {log.note || "—"}
                        </td>
                      </tr>
                    )
                  })
                )}
                <tr id="audit-no-matches" style={{ display: "none" }}>
                  <td colSpan={5} className="py-12 text-center text-[15px] text-slate-gray">
                    No matching audit records found.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Client-side Instant Filter Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const input = document.getElementById('audit-search-input');
              const rows = document.querySelectorAll('.audit-table-row');
              const countEl = document.getElementById('audit-count-display');
              const noMatchEl = document.getElementById('audit-no-matches');
              const totalCount = rows.length;

              if (!input) return;

              input.addEventListener('input', function(e) {
                const q = e.target.value.toLowerCase().trim();
                let visible = 0;

                rows.forEach(function(row) {
                  const data = (row.getAttribute('data-search') || '').toLowerCase();
                  if (data.includes(q)) {
                    row.style.display = '';
                    visible++;
                  } else {
                    row.style.display = 'none';
                  }
                });

                if (countEl) {
                  countEl.textContent = q
                    ? visible + ' of ' + totalCount + ' audit entries'
                    : totalCount + (totalCount === 1 ? ' audit entry' : ' audit entries');
                }

                if (noMatchEl) {
                  noMatchEl.style.display = (visible === 0 && totalCount > 0) ? '' : 'none';
                }
              });
            })();
          `,
        }}
      />
    </div>
  )
}
