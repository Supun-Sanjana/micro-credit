import { verifyAdminSession } from "@/lib/admin-session"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { Building2, FileText, Database, CreditCard, LogOut, ShieldCheck, ListTodo } from "lucide-react"

export const dynamic = "force-dynamic"

export default async function AdminDashboard() {
  const session = await verifyAdminSession()
  
  if (!session) {
    redirect("/app/admin/login")
  }

  const handleLogout = async () => {
    "use server"
    cookies().set("admin_session", "", { expires: new Date(0) })
    redirect("/app/admin/login")
  }

  // Aggregate Metrics (Phase A6.1)
  const subscriptions = await prisma.subscription.findMany({
    include: { plan: true }
  });

  const orgStats = {
    total: subscriptions.length,
    active: subscriptions.filter(s => s.status === 'ACTIVE').length,
    trial: subscriptions.filter(s => s.status === 'TRIAL').length,
    suspended: subscriptions.filter(s => s.status === 'SUSPENDED').length,
  };

  const pendingClaimsCount = await prisma.paymentClaim.count({
    where: { status: 'PENDING' }
  });

  const storageUsageMb = subscriptions
    .filter(s => s.status !== 'SUSPENDED')
    .reduce((sum, s) => sum + (s.plan?.storageQuotaMb || 0), 0);
  const storageUsageGb = (storageUsageMb / 1024).toFixed(1);

  const roughMRR = subscriptions
    .filter(s => s.status === 'ACTIVE')
    .reduce((sum, s) => sum + Number(s.plan?.monthlyPrice || 0), 0);

  return (
    <div className="min-h-screen bg-mist-gray p-6 sm:p-10 font-sans text-ink-black">
      <div className="max-w-[1200px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-[44px] font-serif font-normal text-ink-black tracking-[-0.66px] leading-[1.3]">
              Platform Overview
            </h1>
            <p className="text-[17px] text-slate-gray mt-1">
              Logged in as {session.email}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <form action={handleLogout}>
              <button 
                type="submit" 
                className="flex items-center gap-2 text-[14px] font-medium px-4 py-2 rounded-full bg-[#fce8e6] text-[#c5221f] hover:bg-[#fad4d1] transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </form>
          </div>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/app/admin/orgs" className="bg-paper-white p-5 rounded-[20px] border border-[#ececec] shadow-subtle-3 hover:border-ink-black transition-colors group flex flex-col gap-3">
            <div className="h-10 w-10 rounded-full bg-mist-gray flex items-center justify-center text-ink-black group-hover:bg-ink-black group-hover:text-paper-white transition-colors">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-[15px]">Organizations</div>
              <div className="text-[13px] text-slate-gray">Manage tenant accounts</div>
            </div>
          </Link>

          <Link href="/app/admin/claims" className="bg-paper-white p-5 rounded-[20px] border border-[#ececec] shadow-subtle-3 hover:border-ink-black transition-colors group flex flex-col gap-3 relative">
            <div className="h-10 w-10 rounded-full bg-mist-gray flex items-center justify-center text-ink-black group-hover:bg-ink-black group-hover:text-paper-white transition-colors">
              <FileText className="h-5 w-5" />
            </div>
            {pendingClaimsCount > 0 && (
              <span className="absolute top-5 right-5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c5221f] px-1.5 text-[11px] font-bold text-white">
                {pendingClaimsCount}
              </span>
            )}
            <div>
              <div className="font-medium text-[15px]">Payment Claims</div>
              <div className="text-[13px] text-slate-gray">Verify bank transfers</div>
            </div>
          </Link>

          <Link href="/app/admin/plans" className="bg-paper-white p-5 rounded-[20px] border border-[#ececec] shadow-subtle-3 hover:border-ink-black transition-colors group flex flex-col gap-3">
            <div className="h-10 w-10 rounded-full bg-mist-gray flex items-center justify-center text-ink-black group-hover:bg-ink-black group-hover:text-paper-white transition-colors">
              <ListTodo className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-[15px]">Subscription Plans</div>
              <div className="text-[13px] text-slate-gray">Manage pricing tiers</div>
            </div>
          </Link>

          <Link href="/app/admin/audit-logs" className="bg-paper-white p-5 rounded-[20px] border border-[#ececec] shadow-subtle-3 hover:border-ink-black transition-colors group flex flex-col gap-3">
            <div className="h-10 w-10 rounded-full bg-mist-gray flex items-center justify-center text-ink-black group-hover:bg-ink-black group-hover:text-paper-white transition-colors">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="font-medium text-[15px]">Audit Logs</div>
              <div className="text-[13px] text-slate-gray">View platform activity</div>
            </div>
          </Link>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          {/* Tenant Status */}
          <div className="bg-paper-white p-8 rounded-[24px] border border-[#ececec] shadow-subtle-3">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="h-5 w-5 text-slate-gray" />
              <h2 className="text-[18px] font-medium tracking-tight">Tenant Status Overview</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-mist-gray rounded-[16px]">
                <div className="text-[13px] text-slate-gray font-medium uppercase tracking-wider mb-1">Total Orgs</div>
                <div className="text-[32px] font-sans tracking-tight">{orgStats.total}</div>
              </div>
              <div className="p-4 bg-[#e6f4ea] text-[#137333] rounded-[16px]">
                <div className="text-[13px] font-medium uppercase tracking-wider mb-1">Active</div>
                <div className="text-[32px] font-sans tracking-tight">{orgStats.active}</div>
              </div>
              <div className="p-4 bg-[#fbe1d1] text-[#5d2a1a] rounded-[16px]">
                <div className="text-[13px] font-medium uppercase tracking-wider mb-1">Trial</div>
                <div className="text-[32px] font-sans tracking-tight">{orgStats.trial}</div>
              </div>
              <div className="p-4 bg-[#fce8e6] text-[#c5221f] rounded-[16px]">
                <div className="text-[13px] font-medium uppercase tracking-wider mb-1">Suspended</div>
                <div className="text-[32px] font-sans tracking-tight">{orgStats.suspended}</div>
              </div>
            </div>
          </div>

          {/* Revenue & Infrastructure */}
          <div className="bg-paper-white p-8 rounded-[24px] border border-[#ececec] shadow-subtle-3 flex flex-col justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <CreditCard className="h-5 w-5 text-slate-gray" />
                <h2 className="text-[18px] font-medium tracking-tight">Rough MRR (Estimated)</h2>
              </div>
              <div className="text-[48px] font-serif tracking-tight leading-none text-[#137333]">
                LKR {roughMRR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[14px] text-slate-gray mt-2">
                Based strictly on active subscriptions at current plan rates.
              </div>
            </div>
            
            <div className="pt-6 border-t border-[#ececec]">
              <div className="flex items-center gap-3 mb-4">
                <Database className="h-5 w-5 text-slate-gray" />
                <h2 className="text-[15px] font-medium tracking-tight">Platform Allocated Storage</h2>
              </div>
              <div className="flex items-end gap-2">
                <div className="text-[28px] font-sans tracking-tight leading-none">{storageUsageGb}</div>
                <div className="text-[15px] text-slate-gray font-medium pb-[2px]">GB</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
