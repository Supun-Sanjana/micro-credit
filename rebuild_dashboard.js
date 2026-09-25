const fs = require('fs');
const file = 'app/app/(dashboard)/dashboard/page.tsx';

const fullCode = `import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { ArrowRight, TrendingUp, Users, DollarSign, Wallet, FileText, Activity } from "lucide-react"
import { FinancialChart } from "@/components/financial-chart"

export default async function DashboardPage() {
  const session = await auth()
  
  if (session?.user?.role === "FIELD_OFFICER") {
    const officerId = session.user.id
    
    // Fetch assigned centres
    const assignedCentres = await prisma.centre.findMany({
      where: { officerId },
      include: {
        members: {
          include: {
            loans: {
              where: { status: { in: ['ACTIVE', 'OVERDUE'] } },
              include: {
                repaymentSchedule: {
                  where: { isPaid: false, scheduledDate: { lte: new Date() } }
                }
              }
            }
          }
        }
      }
    })
    
    let totalTarget = 0
    let totalOverdue = 0
    let centresList: any[] = []
    
    const today = new Date()
    today.setHours(0,0,0,0)

    for (const c of assignedCentres) {
      let centreTarget = 0
      for (const m of c.members) {
        for (const l of m.loans) {
          for (const s of l.repaymentSchedule) {
            const isToday = s.scheduledDate.getTime() === today.getTime()
            if (isToday) {
              totalTarget += Number(s.scheduledAmount)
              centreTarget += Number(s.scheduledAmount)
            } else if (s.scheduledDate < today) {
              totalOverdue += Number(s.scheduledAmount)
              totalTarget += Number(s.scheduledAmount)
              centreTarget += Number(s.scheduledAmount)
            }
          }
        }
      }
      centresList.push({ id: c.id, name: c.name, target: centreTarget, membersCount: c.members.length })
    }

    return (
      <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
        <div>
          <h1 className="text-[28px] font-serif font-medium tracking-tight text-ink-black mb-1">
            Officer Dashboard
          </h1>
          <p className="text-[15px] text-slate-gray">
            Overview of today's collections and tasks for your assigned centres.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard title="Today's Target (Incl. Overdue)" value={\`LKR \${totalTarget.toLocaleString()}\`} delta={<><TrendingUp className="w-3 h-3 mr-1 inline" />\${totalOverdue > 0 ? \`LKR \${totalOverdue.toLocaleString()} Overdue\` : 'On track'}</>} />
          <StatCard title="Assigned Centres" value={\`\${assignedCentres.length}\`} delta={<><ArrowRight className="w-3 h-3 mr-1 inline" />View Itinerary below</>} />
        </div>
        
        <div className="mt-8">
          <h2 className="text-[20px] font-sans font-medium text-ink-black mb-6">Today's Itinerary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {centresList.map(c => (
              <div key={c.id} className="bg-paper-white rounded-[20px] p-6 shadow-subtle flex flex-col gap-3 border border-[#ececec]">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium text-[16px] text-ink-black">{c.name}</h3>
                    <span className="text-[14px] text-slate-gray">{c.membersCount} members</span>
                  </div>
                  <span className="bg-[#f0f9f4] text-[#137333] px-3 py-1 rounded-full text-[13px] font-medium">
                    LKR {c.target.toLocaleString()}
                  </span>
                </div>
                <Link href={\`/app/collection?centreId=\${c.id}\`} className="mt-2 flex items-center justify-center gap-2 bg-ink-black text-paper-white py-2 rounded-full text-[14px] font-medium hover:bg-ink-black/90 transition-colors">
                  Open Collection Sheet <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            ))}
            {centresList.length === 0 && (
              <div className="col-span-full py-8 text-center text-slate-gray bg-mist-gray rounded-[20px]">
                No centres assigned to your portfolio yet.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Admin View (Default)
  const orgId = session?.user?.organizationId;
  if (!orgId) return <div>Invalid Session</div>;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [
    activeLoans,
    todaysRepayments,
    membersCount,
    savingsAccounts,
    recentAuditLogs
  ] = await Promise.all([
    prisma.loan.findMany({ where: { member: { organizationId: orgId }, status: 'ACTIVE' }, select: { outstanding: true } }),
    prisma.loanRepayment.findMany({ 
      where: { 
        organizationId: orgId, 
        paidDate: { gte: today } 
      }, 
      select: { amount: true } 
    }),
    prisma.member.count({ where: { organizationId: orgId } }),
    prisma.savingsAccount.findMany({ where: { organizationId: orgId, status: 'ACTIVE' }, select: { balance: true } }),
    prisma.auditLog.findMany({ where: { organizationId: orgId }, orderBy: { createdAt: 'desc' }, take: 5, include: { user: true } })
  ]);

  const activeCapital = activeLoans.reduce((sum, loan) => sum + Number(loan.outstanding), 0);
  const todayCollections = todaysRepayments.reduce((sum, r) => sum + Number(r.amount), 0);
  const totalSavings = savingsAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  return (
    <div className="flex flex-col gap-10 w-full max-w-7xl mx-auto">
      <div>
        <h1 className="text-[28px] font-serif font-medium tracking-tight text-ink-black mb-1">
          Performance Overview
        </h1>
        <p className="text-[15px] text-slate-gray">
          Track lending metrics, savings pool, and overall portfolio health.
        </p>
      </div>

      {/* Top Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Active Capital" value={\`LKR \${activeCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}\`} delta={<><TrendingUp className="w-3 h-3 mr-1 inline" />Live Portfolio</>} />
        <StatCard title="Today's Collections" value={\`LKR \${todayCollections.toLocaleString(undefined, { maximumFractionDigits: 0 })}\`} delta={<><TrendingUp className="w-3 h-3 mr-1 inline" />Real-time Sync</>} />
        <StatCard title="Total Savings" value={\`LKR \${totalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}\`} delta={<><Wallet className="w-3 h-3 mr-1 inline" />Pooled Capital</>} />
        <StatCard title="Registered Members" value={membersCount.toString()} delta={<><Users className="w-3 h-3 mr-1 inline" />Active Community</>} />
      </div>

      {/* Full Width Chart */}
      <div className="bg-paper-white border border-[#ececec] rounded-[24px] p-8 shadow-subtle-3">
        <FinancialChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <h2 className="text-[20px] font-serif font-medium tracking-tight text-ink-black">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Link href="/app/members" className="group bg-paper-white border border-[#ececec] rounded-[16px] p-6 shadow-subtle flex flex-col gap-4 hover:border-ink-black transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#f4f4f4] flex items-center justify-center text-ink-black">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-[17px] text-ink-black group-hover:underline">Manage Members</h3>
                <p className="text-[14px] text-slate-gray mt-1">Register members and view KYC profiles.</p>
              </div>
            </Link>
            
            <Link href="/app/loans" className="group bg-paper-white border border-[#ececec] rounded-[16px] p-6 shadow-subtle flex flex-col gap-4 hover:border-ink-black transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#f4f4f4] flex items-center justify-center text-ink-black">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-[17px] text-ink-black group-hover:underline">Disburse Loans</h3>
                <p className="text-[14px] text-slate-gray mt-1">Approve and disburse member loans.</p>
              </div>
            </Link>

            <Link href="/app/accounting" className="group bg-paper-white border border-[#ececec] rounded-[16px] p-6 shadow-subtle flex flex-col gap-4 hover:border-ink-black transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#f4f4f4] flex items-center justify-center text-ink-black">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-[17px] text-ink-black group-hover:underline">General Ledger</h3>
                <p className="text-[14px] text-slate-gray mt-1">View automated double-entry journals.</p>
              </div>
            </Link>

            <Link href="/app/collection" className="group bg-paper-white border border-[#ececec] rounded-[16px] p-6 shadow-subtle flex flex-col gap-4 hover:border-ink-black transition-colors">
              <div className="w-12 h-12 rounded-full bg-[#f4f4f4] flex items-center justify-center text-ink-black">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-[17px] text-ink-black group-hover:underline">Daily Collections</h3>
                <p className="text-[14px] text-slate-gray mt-1">Reconcile field officer daily sheets.</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="flex flex-col gap-5">
          <h2 className="text-[20px] font-serif font-medium tracking-tight text-ink-black">Recent Activity</h2>
          <div className="bg-paper-white border border-[#ececec] rounded-[16px] p-6 shadow-subtle flex flex-col gap-5">
            {recentAuditLogs.length === 0 ? (
              <p className="text-[14px] text-slate-gray">No recent activities found.</p>
            ) : (
              recentAuditLogs.map(log => (
                <div key={log.id} className="flex gap-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#137333] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-[15px] text-ink-black font-medium leading-tight mb-1">
                      {log.action} {log.entityType}
                    </p>
                    <p className="text-[13px] text-slate-gray">
                      {log.user?.name || log.user?.email || 'System'} &bull; {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
            
            <Link href="/app/settings/audit-log" className="text-[14px] font-medium text-ink-black hover:underline mt-2 flex items-center">
              View Audit Log <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

function StatCard({ title, value, delta }: { title: string, value: string, delta: React.ReactNode }) {
  return (
    <div className="bg-paper-white rounded-[20px] p-6 shadow-subtle-3 flex flex-col gap-2">
      <span className="text-[15px] font-medium text-slate-gray tracking-wide">{title}</span>
      <span className="text-[32px] font-sans font-medium text-ink-black tracking-[-0.5px] truncate">{value}</span>
      <span className="text-[13px] font-medium text-[#137333] mt-2 flex items-center">{delta}</span>
    </div>
  )
}`;

fs.writeFileSync(file, fullCode);
console.log('done');
