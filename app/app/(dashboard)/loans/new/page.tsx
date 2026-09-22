"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Member, LoanProduct } from "@/lib/types"

export default function NewLoanPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  
  const [members, setMembers] = useState<Member[]>([])
  const [products, setProducts] = useState<LoanProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    memberId: "",
    loanProductId: "",
    loanAmount: 50000,
    
    // Guarantor
    guarantorType: "EXISTING" as "EXISTING" | "NEW",
    guarantorMemberId: "",
    guarantorName: "",
    guarantorNic: "",
    guarantorContact: "",
    guarantorRelationship: ""
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const [membersRes, productsRes] = await Promise.all([
          fetch('/api/members'),
          fetch('/api/loan-products')
        ])
        
        if (membersRes.ok) setMembers(await membersRes.json())
        if (productsRes.ok) setProducts(await productsRes.json())
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const selectedProduct = products.find(p => p.id === formData.loanProductId)
  const rate = selectedProduct ? (selectedProduct as any).rate || 0.1 : 0
  const totalReceivable = formData.loanAmount * (1 + rate)
  const weeklyRental = selectedProduct ? totalReceivable / selectedProduct.numberOfWeeks : 0

  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      const res = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        router.push("/app/loans")
      } else {
        alert("Failed to submit application")
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex flex-col gap-10 max-w-[800px] mx-auto">
      
      {/* Hero Section */}
      <div className="flex flex-col gap-4">
        <h1 
          className="text-[44px] leading-[1.3] text-ink-black font-serif font-normal"
          style={{ letterSpacing: '-0.66px' }}
        >
          New Loan Application
        </h1>
        <p className="text-[17px] text-slate-gray max-w-[600px] leading-[1.35]">
          Originate a new loan facility and record guarantor compliance details.
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center gap-3">
        <div className={`h-[4px] flex-1 rounded-full transition-colors ${step >= 1 ? "bg-ink-black" : "bg-mist-gray"}`} />
        <div className={`h-[4px] flex-1 rounded-full transition-colors ${step >= 2 ? "bg-ink-black" : "bg-mist-gray"}`} />
      </div>

      {/* Step 1: Loan Details */}
      {step === 1 && (
        <div className="bg-paper-white rounded-[24px] shadow-subtle-3 p-[40px] flex flex-col gap-8">
          <h2 className="text-[26px] font-sans font-medium text-ink-black tracking-[-0.23px]">
            Facility Details
          </h2>
          
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-[15px] text-ink-black font-sans">Borrower (Member)</label>
                <Link href="/app/members" className="text-[13px] text-slate-gray hover:text-ink-black hover:underline transition-colors font-medium">
                  + Register New Member
                </Link>
              </div>
              <select 
                value={formData.memberId} 
                onChange={e => setFormData({...formData, memberId: e.target.value})}
                className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black appearance-none"
              >
                <option value="" disabled className="text-smoke-gray">{isLoading ? "Loading..." : "Select Member"}</option>
                {members.map(m => (
                  <option key={m.id} value={m.id}>{m.name} ({m.memberNumber})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-ink-black font-sans ml-1">Loan Product</label>
                <select 
                  value={formData.loanProductId} 
                  onChange={e => setFormData({...formData, loanProductId: e.target.value})}
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black appearance-none"
                >
                  <option value="" disabled className="text-smoke-gray">{isLoading ? "Loading..." : "Select Product"}</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[15px] text-ink-black font-sans ml-1">Principal Amount (LKR)</label>
                <input 
                  type="number"
                  value={formData.loanAmount}
                  onChange={e => setFormData({...formData, loanAmount: parseInt(e.target.value) || 0})}
                  className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black"
                />
              </div>
            </div>

            {/* Terms Summary (Neutral Block) */}
            <div className="bg-mist-gray rounded-[16px] p-[24px] grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
              <div className="flex flex-col gap-1">
                <span className="text-[13px] text-ash-gray font-sans uppercase tracking-wider">Term</span>
                <span className="text-[18px] text-ink-black font-sans font-medium">{selectedProduct?.numberOfWeeks || 0} Weeks</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[13px] text-ash-gray font-sans uppercase tracking-wider">Rate (Mock)</span>
                <span className="text-[18px] text-ink-black font-sans font-medium">{(rate * 100).toFixed(1)}%</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[13px] text-ash-gray font-sans uppercase tracking-wider">Total</span>
                <span className="text-[18px] text-ink-black font-sans font-medium">LKR {totalReceivable.toLocaleString()}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[13px] text-ash-gray font-sans uppercase tracking-wider">Weekly</span>
                <span className="text-[18px] text-ink-black font-sans font-medium">LKR {weeklyRental.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button 
                onClick={() => setStep(2)} 
                disabled={!formData.memberId || !formData.loanProductId}
                className="flex items-center justify-center bg-ink-black text-paper-white rounded-full px-[24px] py-[14px] text-[16px] font-sans transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue to Guarantor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Guarantor */}
      {step === 2 && (
        <div className="bg-paper-white rounded-[24px] shadow-subtle-3 p-[40px] flex flex-col gap-8">
          <h2 className="text-[26px] font-sans font-medium text-ink-black tracking-[-0.23px]">
            Guarantor Details
          </h2>
          
          <div className="flex flex-col gap-8">
            
            {/* Custom Tab Pills */}
            <div className="flex items-center gap-2 bg-mist-gray p-[4px] rounded-full w-fit">
              <button 
                onClick={() => setFormData({...formData, guarantorType: "EXISTING"})}
                className={`px-[24px] py-[10px] rounded-full text-[15px] font-sans transition-colors ${formData.guarantorType === "EXISTING" ? "bg-paper-white text-ink-black font-medium shadow-subtle-2" : "text-slate-gray hover:text-ink-black"}`}
              >
                Existing Member
              </button>
              <button 
                onClick={() => setFormData({...formData, guarantorType: "NEW"})}
                className={`px-[24px] py-[10px] rounded-full text-[15px] font-sans transition-colors ${formData.guarantorType === "NEW" ? "bg-paper-white text-ink-black font-medium shadow-subtle-2" : "text-slate-gray hover:text-ink-black"}`}
              >
                External Guarantor
              </button>
            </div>

            {formData.guarantorType === "EXISTING" && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[15px] text-ink-black font-sans ml-1">Select Member</label>
                  <select 
                    value={formData.guarantorMemberId} 
                    onChange={e => setFormData({...formData, guarantorMemberId: e.target.value})}
                    className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black appearance-none"
                  >
                    <option value="" disabled className="text-smoke-gray">Search member...</option>
                    {members.filter(m => m.id !== formData.memberId).map(m => (
                      <option key={m.id} value={m.id}>{m.name} ({m.nic})</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[15px] text-ink-black font-sans ml-1">Relationship to Borrower</label>
                  <input 
                    value={formData.guarantorRelationship} 
                    onChange={e => setFormData({...formData, guarantorRelationship: e.target.value})}
                    placeholder="e.g. Spouse, Friend, Parent"
                    className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black placeholder:text-smoke-gray outline-none focus:border-ink-black"
                  />
                </div>
              </div>
            )}

            {formData.guarantorType === "NEW" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex flex-col gap-2">
                  <label className="text-[15px] text-ink-black font-sans ml-1">Full Name</label>
                  <input 
                    value={formData.guarantorName} 
                    onChange={e => setFormData({...formData, guarantorName: e.target.value})}
                    className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[15px] text-ink-black font-sans ml-1">NIC</label>
                  <input 
                    value={formData.guarantorNic} 
                    onChange={e => setFormData({...formData, guarantorNic: e.target.value})}
                    className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[15px] text-ink-black font-sans ml-1">Contact Number</label>
                  <input 
                    value={formData.guarantorContact} 
                    onChange={e => setFormData({...formData, guarantorContact: e.target.value})}
                    className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-[15px] text-ink-black font-sans ml-1">Relationship</label>
                  <input 
                    value={formData.guarantorRelationship} 
                    onChange={e => setFormData({...formData, guarantorRelationship: e.target.value})}
                    className="bg-paper-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-ink-black outline-none focus:border-ink-black"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-6 border-t border-border/40 mt-2">
              <button 
                onClick={() => setStep(1)}
                className="flex items-center justify-center border border-ink-black text-ink-black rounded-full px-[24px] py-[14px] text-[16px] font-sans transition-opacity hover:opacity-70"
              >
                Back
              </button>
              <button 
                onClick={handleSave}
                disabled={isSubmitting}
                className="flex items-center justify-center bg-ink-black text-paper-white rounded-full px-[24px] py-[14px] text-[16px] font-sans transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
