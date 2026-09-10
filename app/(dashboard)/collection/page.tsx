"use client"

import { useState } from "react"
import { format } from "date-fns"
import { mockCentres, mockMembers, mockLoans } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Save, CheckCircle2, UserCircle2, Ban } from "lucide-react"

export default function CollectionPage() {
  const [selectedDate, setSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"))
  const [selectedCentre, setSelectedCentre] = useState<string>(mockCentres[0].id)
  
  // Calculate due list based on selected centre
  const dueList = mockMembers
    .filter(m => m.centreId === selectedCentre)
    .map(member => {
      const activeLoan = mockLoans.find(l => l.memberId === member.id && l.status === "ACTIVE")
      return {
        member,
        loan: activeLoan,
        dueAmount: activeLoan ? Number(activeLoan.weeklyRental) : 0,
      }
    })
    .filter(item => item.loan !== undefined)

  const [collections, setCollections] = useState<Record<string, { amount: number | "", note: string }>>(
    dueList.reduce((acc, item) => ({
      ...acc,
      [item.loan!.id]: { amount: item.dueAmount, note: "" }
    }), {})
  )

  const handleAmountChange = (loanId: string, val: string) => {
    setCollections(prev => ({
      ...prev,
      [loanId]: { ...prev[loanId], amount: val === "" ? "" : Number(val) }
    }))
  }

  const handleNp = (loanId: string) => {
    setCollections(prev => ({
      ...prev,
      [loanId]: { amount: 0, note: "NP" }
    }))
  }

  const handleSave = () => {
    console.log("Saving collections:", collections)
    alert("Saved successfully! (Mock)")
  }

  return (
    <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Daily Collection</h1>
          <p className="text-sm text-gray-500">Record center cash collections for the day</p>
        </div>
        <Button onClick={handleSave} className="hidden md:flex">
          <Save className="w-4 h-4 mr-2" />
          Bulk Save
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date">Collection Date</Label>
            <Input 
              id="date" 
              type="date" 
              value={selectedDate} 
              onChange={(e) => setSelectedDate(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="centre">Centre</Label>
            <Select value={selectedCentre} onValueChange={(v) => setSelectedCentre(v || "")}>
              <SelectTrigger id="centre">
                <SelectValue placeholder="Select Centre" />
              </SelectTrigger>
              <SelectContent>
                {mockCentres.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.centreCode})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {dueList.map((item) => {
          const loanId = item.loan!.id
          const col = collections[loanId] || { amount: "", note: "" }
          const isSettled = col.note === "SETTLEMENT"
          
          return (
            <Card key={loanId} className="overflow-hidden">
              <CardContent className="p-0 flex flex-col sm:flex-row border-l-4 border-blue-500">
                
                {/* Member Info Side */}
                <div className="p-3 sm:p-4 flex-1 flex items-start gap-3 bg-gray-50/50">
                  <UserCircle2 className="w-10 h-10 text-gray-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm sm:text-base text-gray-900 truncate">
                      {item.member.name}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                      <span>{item.member.memberNumber}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">Grp {item.member.groupNumber}</Badge>
                    </div>
                    <div className="text-xs text-gray-600 mt-1 font-medium">
                      Due: LKR {item.dueAmount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Input Side */}
                <div className="p-3 sm:p-4 border-t sm:border-t-0 sm:border-l border-gray-100 flex flex-col justify-center gap-2 bg-white sm:w-64 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-2.5 text-xs text-gray-500 font-medium">Rs</span>
                      <Input 
                        type="number"
                        className={`pl-8 pr-2 h-10 font-bold ${col.amount === 0 ? "text-red-600 bg-red-50" : isSettled ? "text-green-600 bg-green-50" : ""}`}
                        value={col.amount}
                        onChange={(e) => handleAmountChange(loanId, e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <Button 
                      variant="outline" 
                      size="icon"
                      className="shrink-0 h-10 w-10 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => handleNp(loanId)}
                      title="No Payment"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Settlement / Note Row */}
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-semibold text-gray-500 uppercase">
                      {col.note || "NORMAL"}
                    </span>
                    <SettlementModal 
                      loanId={loanId} 
                      currentOutstanding={Number(item.loan!.outstanding)} 
                      onSettle={(amount) => {
                        setCollections(prev => ({
                          ...prev,
                          [loanId]: { amount, note: "SETTLEMENT" }
                        }))
                      }} 
                    />
                  </div>
                </div>

              </CardContent>
            </Card>
          )
        })}

        {dueList.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            No active loans found for this centre today.
          </div>
        )}
      </div>

      {/* Floating mobile save button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 md:hidden z-10 shadow-lg">
        <Button onClick={handleSave} className="w-full text-base h-12" size="lg">
          <Save className="w-5 h-5 mr-2" />
          Bulk Save Collections
        </Button>
      </div>
    </div>
  )
}

function SettlementModal({ loanId, currentOutstanding, onSettle }: { loanId: string, currentOutstanding: number, onSettle: (amt: number) => void }) {
  const [amount, setAmount] = useState<string>(currentOutstanding.toString())
  
  return (
    <Dialog>
      <DialogTrigger className="text-xs text-blue-600 hover:underline font-medium">
        Settlement?
      </DialogTrigger>
      <DialogContent className="sm:max-w-md w-[95%] rounded-xl">
        <DialogHeader>
          <DialogTitle>Loan Settlement</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="p-3 bg-blue-50 text-blue-800 rounded-lg text-sm flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
            <p>Current outstanding balance is <strong>LKR {currentOutstanding.toLocaleString()}</strong>. Settling will close this loan.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="settle-amount">Settlement Amount Received</Label>
            <Input 
              id="settle-amount"
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)} 
              className="font-bold text-lg"
            />
          </div>
          <Button className="w-full" onClick={() => onSettle(Number(amount))}>
            Confirm Settlement
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
