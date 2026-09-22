import { getScopedDal } from "@/lib/dal"
import { notFound } from "next/navigation"
import RestructureForm from "./RestructureForm"

export default async function RestructurePage({ params }: { params: Promise<{ id: string }> }) {
  const dal = await getScopedDal()
  const { id } = await params

  const loan = await dal.prisma.loan.findFirst({
    where: { id },
    include: {
      member: true,
      repaymentSchedule: {
        where: { supersededAt: null },
        orderBy: { instalmentNumber: "asc" }
      }
    }
  })

  if (!loan) {
    notFound()
  }

  // Serialize complex objects for client component
  const serializedLoan = {
    ...loan,
    loanAmount: loan.loanAmount.toString(),
    weeklyRental: loan.weeklyRental.toString(),
    totalReceivable: loan.totalReceivable.toString(),
    totalPaid: loan.totalPaid.toString(),
    outstanding: loan.outstanding.toString(),
    grantedDate: loan.grantedDate?.toISOString() ?? null,
    expireDate: loan.expireDate?.toISOString() ?? null,
    createdAt: loan.createdAt.toISOString(),
    updatedAt: loan.updatedAt.toISOString(),
    member: {
      ...loan.member,
      createdAt: loan.member.createdAt.toISOString(),
      updatedAt: loan.member.updatedAt.toISOString(),
    },
    repaymentSchedule: loan.repaymentSchedule.map((s) => ({
      ...s,
      scheduledAmount: s.scheduledAmount.toString(),
      paidAmount: s.paidAmount.toString(),
      scheduledDate: s.scheduledDate.toISOString(),
      supersededAt: s.supersededAt?.toISOString() ?? null,
      createdAt: s.createdAt.toISOString(),
    }))
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-12">
      <div className="bg-paper-white shadow-subtle p-8 rounded-[20px] flex flex-col gap-2">
        <h1 className="font-serif text-3xl text-ink-black">Restructure Schedule Editor</h1>
        <p className="text-mist-gray">Create a new repayment schedule to supersede the remaining unpaid terms.</p>
      </div>
      
      <RestructureForm loan={serializedLoan} />
    </div>
  )
}
