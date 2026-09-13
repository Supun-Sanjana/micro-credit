"use client"

import { useState } from "react"
import Link from "next/link"
import { mockLoans, mockMembers, mockLoanProducts } from "@/lib/mock-data"
import { Loan } from "@/lib/types"

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>(mockLoans)
  const pendingLoans = loans.filter(l => l.verificationStatus === "PENDING")
  const activeLoans = loans.filter(l => l.verificationStatus !== "PENDING")

  return (
    <div className="flex flex-col gap-8 lg:gap-[48px]">
      
      {/* Hero Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
        <div className="flex flex-col gap-4">
          <h1 
            className="text-[44px] leading-[1.3] text-ink-black font-serif font-normal"
            style={{ letterSpacing: '-0.66px' }}
          >
            Loan Portfolio
          </h1>
          <p className="text-[17px] text-slate-gray max-w-[600px] leading-[1.35]">
            Review pending applications and monitor the active loan portfolio.
          </p>
        </div>
        <Link 
          href="/loans/new"
          className="flex items-center justify-center bg-ink-black text-paper-white rounded-full px-[20px] py-[12px] text-[16px] font-sans transition-opacity hover:opacity-90"
        >
          New Application
        </Link>
      </div>

      {/* Pending Queue - Accent Editorial Card if there are items, otherwise Neutral */}
      {pendingLoans.length > 0 && (
        <div className="bg-blush-peach rounded-[24px] p-[40px]">
          <h2 className="text-[26px] font-sans font-medium text-sienna-brown tracking-[-0.23px] mb-6">
            Verification Queue ({pendingLoans.length})
          </h2>
          <div className="flex flex-col gap-4">
            {pendingLoans.map(loan => {
              const member = mockMembers.find(m => m.id === loan.memberId)
              const product = mockLoanProducts.find(p => p.id === loan.loanProductId)
              return (
                <div key={loan.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-sienna-brown/10 last:border-0 gap-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-[14px] text-sienna-brown/70 font-sans">{loan.createdAt.toISOString().split('T')[0]}</span>
                    <span className="text-[18px] font-sans text-sienna-brown font-medium">{member?.name}</span>
                    <span className="text-[15px] font-sans text-sienna-brown/80">{product?.name || loan.loanType}</span>
                  </div>
                  <div className="flex flex-col sm:items-end gap-1">
                    <span className="text-[20px] font-sans font-medium text-sienna-brown">
                      LKR {Number(loan.loanAmount).toLocaleString()}
                    </span>
                    <div className="flex gap-3 mt-2">
                      <Link 
                        href={`/loans/${loan.id}`}
                        className="text-[15px] text-sienna-brown hover:underline underline-offset-4"
                      >
                        Review details →
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All Loans - Neutral Card */}
      <div className="bg-mist-gray rounded-[24px] p-[32px] md:p-[40px]">
        <h2 className="text-[26px] font-sans font-medium text-ink-black tracking-[-0.23px] mb-8">
          Active Portfolio
        </h2>
        
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/40">
                <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Borrower</th>
                <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Product</th>
                <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Amount</th>
                <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal">Outstanding</th>
                <th className="pb-4 font-sans text-[15px] text-slate-gray font-normal text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {activeLoans.map(loan => {
                const member = mockMembers.find(m => m.id === loan.memberId)
                const product = mockLoanProducts.find(p => p.id === loan.loanProductId)
                return (
                  <tr key={loan.id} className="border-b border-border/40 last:border-0 group">
                    <td className="py-5 pr-4">
                      <Link href={`/loans/${loan.id}`} className="text-[16px] font-sans text-ink-black hover:text-slate-gray transition-colors">
                        {member?.name}
                      </Link>
                    </td>
                    <td className="py-5 pr-4 text-[16px] font-sans text-ink-black">
                      {product?.name || loan.loanType}
                    </td>
                    <td className="py-5 pr-4 text-[16px] font-sans text-ink-black">
                      LKR {Number(loan.loanAmount).toLocaleString()}
                    </td>
                    <td className="py-5 pr-4 text-[16px] font-sans text-ink-black">
                      LKR {Number(loan.outstanding).toLocaleString()}
                    </td>
                    <td className="py-5 pl-4 text-right">
                      {/* Tag / Category Label approach */}
                      <span className="text-[14px] font-sans text-ash-gray font-normal uppercase tracking-wider">
                        {loan.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  )
}
