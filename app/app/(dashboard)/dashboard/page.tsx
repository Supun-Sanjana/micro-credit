import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { ArrowRight, TrendingUp } from "lucide-react"
import { FinancialChart } from "@/components/financial-chart"

export default async function DashboardPage() {
  const session = await auth()
  
  if (session?.user?.role === "USER") {
    // Officer View
    return (
      <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
        <div>
          <h1 className="text-[28px] font-serif font-medium tracking-tight text-ink-black mb-1">
            Officer Dashboard
          </h1>
          <p className="text-[15px] text-slate-gray">
            Overview of today's collections and tasks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard title="Today's Target" value={"LKR 125,000"} delta={<><TrendingUp className="w-3 h-3 mr-1 inline" />+5% vs yesterday</>} />
          <StatCard title="Collected So Far" value={"LKR 45,000"} delta={<><TrendingUp className="w-3 h-3 mr-1 inline" />36% completion</>} />
        </div>
      </div>
    )
  }

  // Admin View (Default)
  return (
    <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
      <div>
        <h1 className="text-[28px] font-serif font-medium tracking-tight text-ink-black mb-1">
          Performance Overview
        </h1>
        <p className="text-[15px] text-slate-gray">
          Track lending metrics and overall portfolio health.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Active Capital" value={"LKR 2,450k"} delta={<><TrendingUp className="w-3 h-3 mr-1 inline" />+12% vs last quarter</>} />
        <StatCard title="Today's Collections" value={"LKR 45k"} delta={<><TrendingUp className="w-3 h-3 mr-1 inline" />+4.2% vs last week</>} />
        <StatCard title="Registered Members" value={"142"} delta={<><TrendingUp className="w-3 h-3 mr-1 inline" />+8 new this week</>} />
      </div>

      <div className="mt-8 bg-paper-white border border-[#ececec] rounded-[24px] p-8 shadow-subtle-3">
        <FinancialChart />
      </div>
    </div>
  )
}

function StatCard({ title, value, delta }: { title: string, value: string, delta: React.ReactNode }) {
  return (
    <div className="bg-paper-white rounded-[20px] p-6 shadow-subtle-3 flex flex-col gap-2">
      <span className="text-[15px] font-medium text-slate-gray tracking-wide">{title}</span>
      <span className="text-[36px] font-sans font-medium text-ink-black tracking-[-0.5px]">{value}</span>
      <span className="text-[13px] font-medium text-[#137333] mt-2 flex items-center">{delta}</span>
    </div>
  )
}
