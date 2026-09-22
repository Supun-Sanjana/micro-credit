import { auth } from "@/auth"
import prisma from "@/lib/prisma"
import Link from "next/link"
import { ArrowRight, TrendingUp } from "lucide-react"
import { FinancialChart } from "@/components/financial-chart"

export default async function DashboardPage() {
  const session = await auth()
  
  if (session?.user?.role === "USER") {
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
          <StatCard title="Today's Target (Incl. Overdue)" value={`LKR ${totalTarget.toLocaleString()}`} delta={<><TrendingUp className="w-3 h-3 mr-1 inline" />${totalOverdue > 0 ? `LKR ${totalOverdue.toLocaleString()} Overdue` : 'On track'}</>} />
          <StatCard title="Assigned Centres" value={`${assignedCentres.length}`} delta={<><ArrowRight className="w-3 h-3 mr-1 inline" />View Itinerary below</>} />
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
                <Link href={`/app/collection?centreId=${c.id}`} className="mt-2 flex items-center justify-center gap-2 bg-ink-black text-paper-white py-2 rounded-full text-[14px] font-medium hover:bg-ink-black/90 transition-colors">
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
