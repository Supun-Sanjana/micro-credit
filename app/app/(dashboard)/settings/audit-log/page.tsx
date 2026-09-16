import Link from "next/link"
import { getScopedDal } from "@/lib/dal"
import { redirect } from "next/navigation"

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
  if (upper === "CREATE") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-mono font-medium bg-[#e6f4ea] text-[#137333]">
        {action}
      </span>
    )
  }
  if (upper === "DELETE") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[12px] font-mono font-medium bg-[#fce8e6] text-[#c5221f]">
        {action}
      </span>
    )
  }
  if (upper === "UPDATE") {
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
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-[#f0ecfc] text-[#4a2bb3]">
      {targetType}
    </span>
  )
}

export default async function AuditLogPage() {
  let dal
  try {
    dal = await getScopedDal()
  } catch (e) {
    redirect("/login")
  }

  const auditLogs = await dal.prisma.auditLog.findMany({
    include: {
      user: {
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
    <div className="space-y-8 max-w-[1200px] mx-auto w-full">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-serif font-normal text-ink-black tracking-[-0.66px] leading-[1.3]">
            Audit Log
          </h1>
          <p className="text-[15px] text-slate-gray mt-1">
            Immutable traceability record of changes across your organization.
          </p>
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
              placeholder="Filter by action, user, entity type, or note..."
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
                  User
                </th>
                <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                  Action
                </th>
                <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                  Entity
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
                  const searchData = `${log.action} ${log.user?.email || ""} ${log.entityType} ${log.entityId} ${log.note || ""}`.toLowerCase()
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
                        {log.user?.email || "System"}
                      </td>
                      <td className="py-4 px-4 text-[14px]">
                        {getActionBadge(log.action)}
                      </td>
                      <td className="py-4 px-4 text-[14px]">
                        <div className="flex flex-col gap-0.5">
                          <div>{getTargetBadge(log.entityType)}</div>
                          <span className="font-mono text-[12px] text-slate-gray">
                            {log.entityId}
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
