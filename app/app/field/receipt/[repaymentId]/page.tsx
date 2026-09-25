import { getScopedDal } from "@/lib/dal"
import { ShieldCheck, Calendar, Wallet, CheckCircle2 } from "lucide-react"
import Link from "next/link"

export default async function Receipt({ params }: { params: Promise<{ repaymentId: string }> }) {
  const { repaymentId } = await params
  const dal = await getScopedDal()

  const repayment = await dal.prisma.loanRepayment.findUnique({
    where: { id: repaymentId, organizationId: dal.organizationId },
    include: {
      loan: {
        include: {
          member: true
        }
      }
    }
  })

  if (!repayment) {
    return (
      <div className="p-8 text-center text-slate-gray">
        Receipt not found.
      </div>
    )
  }

  const { member } = repayment.loan

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 pb-24">
      <div className="bg-paper-white rounded-3xl border border-[#ececec] p-8 shadow-subtle-1 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-[#137333]" />
        
        <div className="w-16 h-16 bg-[#e6f4ea] text-[#137333] rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        
        <h1 className="text-[28px] leading-[1.3] text-ink-black font-serif font-normal mb-1">
          Payment Successful
        </h1>
        <p className="text-[15px] text-slate-gray mb-8">
          {new Date(repayment.paidDate).toLocaleString()}
        </p>

        <div className="text-[40px] font-serif text-ink-black mb-8 leading-none">
          LKR {Number(repayment.amount).toLocaleString()}
        </div>

        <div className="space-y-4 text-left border-t border-[#ececec] pt-8">
          <div className="flex justify-between items-center pb-4 border-b border-[#ececec]/60">
            <span className="text-[14px] text-slate-gray">Member</span>
            <span className="text-[15px] font-medium text-ink-black">{member.firstName} {member.lastName}</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-[#ececec]/60">
            <span className="text-[14px] text-slate-gray">Loan ID</span>
            <span className="text-[15px] font-medium text-ink-black">{repayment.loan.id.slice(-8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between items-center pb-4 border-b border-[#ececec]/60">
            <span className="text-[14px] text-slate-gray">Payment Method</span>
            <span className="text-[15px] font-medium text-ink-black">{repayment.method}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[14px] text-slate-gray">Receipt No.</span>
            <span className="text-[15px] font-medium text-ink-black">{repayment.id.slice(-8).toUpperCase()}</span>
          </div>
        </div>
      </div>

      <Link
        href="/app/field/centres"
        className="w-full block text-center bg-mist-gray border border-[#ececec] text-ink-black py-4 rounded-xl text-[15px] font-medium active:scale-[0.98] transition-transform"
      >
        Back to Collections
      </Link>
    </div>
  )
}
