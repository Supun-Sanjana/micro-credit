import Link from "next/link"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { verifyAdminSession } from "@/lib/admin-session"

export const dynamic = "force-dynamic"

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

export default async function AdminOrganizationsPage() {
  const session = await verifyAdminSession()
  if (!session) {
    redirect("/app/admin/login")
  }

  const organizations = await prisma.organization.findMany({
    include: {
      subscription: {
        include: {
          plan: {
            select: {
              name: true,
            },
          },
        },
      },
      _count: {
        select: {
          users: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="min-h-screen bg-mist-gray p-6 sm:p-10 font-sans text-ink-black">
      <div className="max-w-[1200px] mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            href="/app/admin"
            className="text-[15px] text-slate-gray hover:text-ink-black transition-colors inline-flex items-center gap-1.5"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Hero Header */}
        <div className="mb-8">
          <h1 className="text-[44px] font-serif font-normal text-ink-black tracking-[-0.66px] leading-[1.3]">
            Organizations
          </h1>
          <p className="text-[17px] text-slate-gray mt-1">
            Platform tenant overview, subscription statuses, and account management.
          </p>
        </div>

        {/* Main Content Card */}
        <div className="bg-paper-white rounded-[24px] border border-[#ececec] shadow-subtle-3 p-6 sm:p-8">
          {/* Search Bar & Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#f2f2f3]">
            <div className="relative w-full max-w-sm">
              <input
                id="org-search-input"
                type="text"
                placeholder="Search organizations by name..."
                className="w-full bg-paper-white border border-[#ececec] rounded-[16px] px-4 py-2.5 text-[15px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black transition-colors"
              />
            </div>
            <div id="org-count-display" className="text-[14px] text-slate-gray font-medium">
              {organizations.length} {organizations.length === 1 ? "organization" : "organizations"}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#ececec]">
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Org Name
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Plan
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Status
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Users
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray">
                    Created
                  </th>
                  <th className="py-3.5 px-4 text-[13px] font-medium uppercase tracking-wider text-ash-gray text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {organizations.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-[15px] text-slate-gray">
                      No organizations found.
                    </td>
                  </tr>
                ) : (
                  organizations.map((org) => {
                    const planName = org.subscription?.plan?.name || "No Plan"
                    const status = org.subscription?.status
                    const userCount = org._count.users
                    const createdFormatted = new Date(org.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })

                    return (
                      <tr
                        key={org.id}
                        data-org-name={org.name}
                        className="org-table-row border-b border-[#f2f2f3] hover:bg-fog-white transition-colors"
                      >
                        <td className="py-4 px-4 font-medium text-[15px] text-ink-black">
                          {org.name}
                        </td>
                        <td className="py-4 px-4 text-[15px] text-slate-gray">
                          {planName}
                        </td>
                        <td className="py-4 px-4">
                          {getStatusBadge(status)}
                        </td>
                        <td className="py-4 px-4 text-[15px] text-slate-gray">
                          {userCount} {userCount === 1 ? "user" : "users"}
                        </td>
                        <td className="py-4 px-4 text-[15px] text-slate-gray">
                          {createdFormatted}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <Link
                            href={`/app/admin/orgs/${org.id}`}
                            className="inline-flex items-center gap-1 text-[14px] font-medium text-ink-black hover:text-slate-gray transition-colors"
                          >
                            View →
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>

            {/* No search matches state */}
            <div
              id="org-no-matches"
              style={{ display: "none" }}
              className="py-12 text-center text-[15px] text-slate-gray"
            >
              No organizations match your search.
            </div>
          </div>
        </div>
      </div>

      {/* Client-side Instant Filter Script */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              const input = document.getElementById('org-search-input');
              const rows = document.querySelectorAll('.org-table-row');
              const countEl = document.getElementById('org-count-display');
              const noMatchEl = document.getElementById('org-no-matches');
              const totalCount = rows.length;

              if (!input) return;

              input.addEventListener('input', function(e) {
                const q = e.target.value.toLowerCase().trim();
                let visible = 0;

                rows.forEach(function(row) {
                  const name = (row.getAttribute('data-org-name') || '').toLowerCase();
                  if (name.includes(q)) {
                    row.style.display = '';
                    visible++;
                  } else {
                    row.style.display = 'none';
                  }
                });

                if (countEl) {
                  countEl.textContent = q
                    ? visible + ' of ' + totalCount + ' organizations'
                    : totalCount + (totalCount === 1 ? ' organization' : ' organizations');
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
