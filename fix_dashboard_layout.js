const fs = require('fs');
const file = 'app/app/(dashboard)/dashboard/page.tsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /return \([\s\S]*?\)\s*\n}\s*\nfunction StatCard/m;

const newReturnBlock = `return (
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

function StatCard`;

content = content.replace(regex, newReturnBlock);

fs.writeFileSync(file, content);
console.log('done');
