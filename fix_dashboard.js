const fs = require('fs');
const file = 'app/app/(dashboard)/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Ensure extra icons are imported
if (!content.includes('Users')) {
  content = content.replace('import { ArrowRight, TrendingUp } from "lucide-react"', 'import { ArrowRight, TrendingUp, Users, DollarSign, Wallet, FileText, Activity } from "lucide-react"');
}

const adminViewRegex = /\/\/ Admin View \(Default\)[\s\S]*/;

const newAdminView = `// Admin View (Default)
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
    prisma.loan.findMany({ where: { organizationId: orgId, status: 'ACTIVE' }, select: { outstanding: true } }),
    prisma.loanRepayment.findMany({ 
      where: { 
        organizationId: orgId, 
        repaymentDate: { gte: today } 
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
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-[28px] font-serif font-medium tracking-tight text-ink-black mb-1">
          Performance Overview
        </h1>
        <p className="text-[15px] text-slate-gray">
          Track lending metrics, savings pool, and overall portfolio health.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Active Capital" value={\`LKR \${activeCapital.toLocaleString(undefined, { maximumFractionDigits: 0 })}\`} delta={<><TrendingUp className="w-3 h-3 mr-1 inline" />Live Portfolio</>} />
        <StatCard title="Today's Collections" value={\`LKR \${todayCollections.toLocaleString(undefined, { maximumFractionDigits: 0 })}\`} delta={<><TrendingUp className="w-3 h-3 mr-1 inline" />Real-time Sync</>} />
        <StatCard title="Total Savings" value={\`LKR \${totalSavings.toLocaleString(undefined, { maximumFractionDigits: 0 })}\`} delta={<><Wallet className="w-3 h-3 mr-1 inline" />Pooled Capital</>} />
        <StatCard title="Registered Members" value={membersCount.toString()} delta={<><Users className="w-3 h-3 mr-1 inline" />Active Community</>} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
        
        {/* Quick Actions */}
        <div className="md:col-span-2 flex flex-col gap-4">
          <h2 className="text-[20px] font-serif font-medium tracking-tight text-ink-black">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            <Link href="/app/members" className="group bg-paper-white border border-[#ececec] rounded-[16px] p-5 shadow-subtle flex flex-col gap-3 hover:border-ink-black transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#f4f4f4] flex items-center justify-center text-ink-black">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-[16px] text-ink-black group-hover:underline">Manage Members</h3>
                <p className="text-[14px] text-slate-gray mt-1">Register members and view KYC profiles.</p>
              </div>
            </Link>
            
            <Link href="/app/loans" className="group bg-paper-white border border-[#ececec] rounded-[16px] p-5 shadow-subtle flex flex-col gap-3 hover:border-ink-black transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#f4f4f4] flex items-center justify-center text-ink-black">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-[16px] text-ink-black group-hover:underline">Disburse Loans</h3>
                <p className="text-[14px] text-slate-gray mt-1">Approve and disburse member loans.</p>
              </div>
            </Link>

            <Link href="/app/accounting" className="group bg-paper-white border border-[#ececec] rounded-[16px] p-5 shadow-subtle flex flex-col gap-3 hover:border-ink-black transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#f4f4f4] flex items-center justify-center text-ink-black">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-[16px] text-ink-black group-hover:underline">General Ledger</h3>
                <p className="text-[14px] text-slate-gray mt-1">View automated double-entry journals.</p>
              </div>
            </Link>

            <Link href="/app/collection" className="group bg-paper-white border border-[#ececec] rounded-[16px] p-5 shadow-subtle flex flex-col gap-3 hover:border-ink-black transition-colors">
              <div className="w-10 h-10 rounded-full bg-[#f4f4f4] flex items-center justify-center text-ink-black">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-medium text-[16px] text-ink-black group-hover:underline">Daily Collections</h3>
                <p className="text-[14px] text-slate-gray mt-1">Reconcile field officer daily sheets.</p>
              </div>
            </Link>
          </div>
          
          <div className="mt-4 bg-paper-white border border-[#ececec] rounded-[24px] p-8 shadow-subtle-3">
            <FinancialChart />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="flex flex-col gap-4">
          <h2 className="text-[20px] font-serif font-medium tracking-tight text-ink-black">Recent Activity</h2>
          <div className="bg-paper-white border border-[#ececec] rounded-[16px] p-5 shadow-subtle flex flex-col gap-4">
            {recentAuditLogs.length === 0 ? (
              <p className="text-[14px] text-slate-gray">No recent activities found.</p>
            ) : (
              recentAuditLogs.map(log => (
                <div key={log.id} className="flex gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#137333] mt-1.5 flex-shrink-0" />
                  <div>
                    <p className="text-[14px] text-ink-black font-medium leading-tight">
                      {log.action} {log.entityType}
                    </p>
                    <p className="text-[13px] text-slate-gray mt-0.5">
                      {log.user.name || log.user.email} • {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
}`

content = content.replace(adminViewRegex, newAdminView);
fs.writeFileSync(file, content);
console.log('done');
