"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { mockMembers, mockLoanProducts } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Save, ArrowRight, ArrowLeft } from "lucide-react"

export default function NewLoanPage() {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2>(1)
  
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

  const selectedProduct = mockLoanProducts.find(p => p.id === formData.loanProductId)
  const rate = selectedProduct ? (selectedProduct as any).rate || 0.1 : 0
  const totalReceivable = formData.loanAmount * (1 + rate)
  const weeklyRental = selectedProduct ? totalReceivable / selectedProduct.numberOfWeeks : 0

  const handleSave = () => {
    alert("Application submitted for verification (Mock)")
    router.push("/loans")
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">New Loan Application</h1>
        <p className="text-gray-500">Originate a new loan and capture guarantor details.</p>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div className={`h-2 flex-1 rounded-full ${step >= 1 ? "bg-blue-600" : "bg-gray-200"}`} />
        <div className={`h-2 flex-1 rounded-full ${step >= 2 ? "bg-blue-600" : "bg-gray-200"}`} />
      </div>

      <Card className={step === 1 ? "block" : "hidden"}>
        <CardHeader>
          <CardTitle>Loan Details</CardTitle>
          <CardDescription>Select borrower and calculate loan terms.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Borrower (Member)</Label>
            <Select value={formData.memberId} onValueChange={v => setFormData({...formData, memberId: v || ""})}>
              <SelectTrigger><SelectValue placeholder="Select Member" /></SelectTrigger>
              <SelectContent>
                {mockMembers.map(m => (
                  <SelectItem key={m.id} value={m.id}>{m.name} ({m.memberNumber})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Loan Product</Label>
              <Select value={formData.loanProductId} onValueChange={v => setFormData({...formData, loanProductId: v || ""})}>
                <SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger>
                <SelectContent>
                  {mockLoanProducts.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Principal Amount (LKR)</Label>
              <Input 
                type="number" 
                value={formData.loanAmount} 
                onChange={e => setFormData({...formData, loanAmount: parseInt(e.target.value) || 0})}
              />
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase">Term</p>
              <p className="font-bold">{selectedProduct?.numberOfWeeks || 0} Weeks</p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase">Rate (Mock)</p>
              <p className="font-bold">{(rate * 100).toFixed(1)}%</p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase">Total</p>
              <p className="font-bold">LKR {totalReceivable.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-blue-600 font-semibold uppercase">Weekly</p>
              <p className="font-bold">LKR {weeklyRental.toFixed(2)}</p>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => setStep(2)} disabled={!formData.memberId || !formData.loanProductId}>
              Next: Guarantor <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className={step === 2 ? "block" : "hidden"}>
        <CardHeader>
          <CardTitle>Guarantor Details</CardTitle>
          <CardDescription>Select an existing member or enter external guarantor details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <Tabs value={formData.guarantorType} onValueChange={v => setFormData({...formData, guarantorType: v as any})}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="EXISTING">Existing Member</TabsTrigger>
              <TabsTrigger value="NEW">External Guarantor</TabsTrigger>
            </TabsList>
            
            <TabsContent value="EXISTING" className="pt-4 space-y-4">
              <div className="space-y-2">
                <Label>Select Member</Label>
                <Select value={formData.guarantorMemberId} onValueChange={v => setFormData({...formData, guarantorMemberId: v || ""})}>
                  <SelectTrigger><SelectValue placeholder="Search member..." /></SelectTrigger>
                  <SelectContent>
                    {mockMembers.filter(m => m.id !== formData.memberId).map(m => (
                      <SelectItem key={m.id} value={m.id}>{m.name} ({m.nic})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Relationship to Borrower</Label>
                <Input value={formData.guarantorRelationship} onChange={e => setFormData({...formData, guarantorRelationship: e.target.value})} placeholder="e.g. Spouse, Friend, Parent" />
              </div>
            </TabsContent>
            
            <TabsContent value="NEW" className="pt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input value={formData.guarantorName} onChange={e => setFormData({...formData, guarantorName: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>NIC</Label>
                  <Input value={formData.guarantorNic} onChange={e => setFormData({...formData, guarantorNic: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Contact Number</Label>
                  <Input value={formData.guarantorContact} onChange={e => setFormData({...formData, guarantorContact: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Relationship</Label>
                  <Input value={formData.guarantorRelationship} onChange={e => setFormData({...formData, guarantorRelationship: e.target.value})} />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-between pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700 text-white">
              <Save className="w-4 h-4 mr-2" /> Submit Application
            </Button>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}
