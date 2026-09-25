"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { addDays, addWeeks, addMonths, format, parseISO } from "date-fns"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

export default function RestructureForm({ loan }: { loan: any }) {
  const router = useRouter()
  
  const [newTerm, setNewTerm] = useState("10")
  const [frequency, setFrequency] = useState("WEEKLY")
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"))
  const [reason, setReason] = useState("")
  
  const [newSchedule, setNewSchedule] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  
  const outstanding = parseFloat(loan.outstanding)
  
  const generateSchedule = () => {
    setError("")
    const term = parseInt(newTerm)
    if (isNaN(term) || term <= 0) {
      setError("Please enter a valid term")
      return
    }
    if (!startDate) {
      setError("Please select a start date")
      return
    }
    
    const amountPerTerm = Math.floor((outstanding / term) * 100) / 100
    let remaining = outstanding
    let current = parseISO(startDate)
    const schedule = []
    
    for (let i = 0; i < term; i++) {
      let amount = amountPerTerm
      if (i === term - 1) {
        amount = Math.max(0, remaining)
      }
      schedule.push({
        id: `new-${i}`,
        scheduledDate: format(current, "yyyy-MM-dd"),
        scheduledAmount: amount.toFixed(2)
      })
      remaining = Math.round((remaining - amount) * 100) / 100
      
      if (frequency === "DAILY") current = addDays(current, 1)
      else if (frequency === "WEEKLY") current = addWeeks(current, 1)
      else if (frequency === "BIWEEKLY") current = addWeeks(current, 2)
      else if (frequency === "MONTHLY") current = addMonths(current, 1)
    }
    
    setNewSchedule(schedule)
  }
  
  const updateScheduleItem = (index: number, field: string, value: string) => {
    const updated = [...newSchedule]
    updated[index] = { ...updated[index], [field]: value }
    setNewSchedule(updated)
  }
  
  const newScheduleTotal = newSchedule.reduce((sum, item) => sum + parseFloat(item.scheduledAmount || "0"), 0)
  
  const handleSubmit = async () => {
    setError("")
    if (!reason.trim()) {
      setError("Reason for restructure is required")
      return
    }
    if (newSchedule.length === 0) {
      setError("Please generate a schedule first")
      return
    }
    if (newScheduleTotal < outstanding) {
      setError(`New schedule total (${newScheduleTotal.toFixed(2)}) must be at least the outstanding balance (${outstanding.toFixed(2)})`)
      return
    }
    
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/loans/${loan.id}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "RESTRUCTURE",
          reason,
          effectiveDate: startDate,
          schedule: newSchedule.map(s => ({
            scheduledDate: s.scheduledDate,
            scheduledAmount: s.scheduledAmount
          }))
        })
      })
      
      if (!res.ok) {
        const body = await res.json()
        throw new Error(body.error || "Failed to restructure loan")
      }
      
      router.push(`/loans/${loan.id}`)
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div className="flex flex-col gap-6">
        <Card className="shadow-subtle rounded-[20px] bg-white border-none">
          <CardHeader>
            <CardTitle className="font-serif text-xl text-navy-900">Current Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-[500px] overflow-auto rounded-lg border border-slate-200/30">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/10">
                    <TableHead className="w-12">No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loan.repaymentSchedule.map((s: any, idx: number) => (
                    <TableRow key={s.id} className={s.isPaid ? "bg-slate-50/5" : ""}>
                      <TableCell className="font-medium text-slate-500">{idx + 1}</TableCell>
                      <TableCell>{format(parseISO(s.scheduledDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>{s.scheduledAmount}</TableCell>
                      <TableCell>
                        <Badge variant={
                          s.status === "PAID" ? "default" 
                          : s.status === "PENDING" ? "outline" 
                          : s.status === "MISSED" ? "destructive" 
                          : "secondary"
                        }>
                          {s.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-6 p-5 bg-slate-50/10 rounded-xl flex justify-between items-center border border-slate-200/20">
              <span className="font-medium text-slate-500">Remaining Outstanding</span>
              <span className="font-serif text-2xl font-bold text-navy-900">{loan.outstanding}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="shadow-subtle rounded-[20px] bg-white border-none">
          <CardHeader>
            <CardTitle className="font-serif text-xl text-navy-900">Configure New Schedule</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label className="text-slate-500">New Term (Periods)</Label>
                <Input type="number" value={newTerm} onChange={e => setNewTerm(e.target.value)} />
              </div>
              <div className="flex flex-col gap-2">
                <Label className="text-slate-500">Frequency</Label>
                <Select value={frequency} onValueChange={(v) => v && setFrequency(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="BIWEEKLY">Biweekly</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Label className="text-slate-500">Start Date</Label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            
            <Button onClick={generateSchedule} variant="outline" className="w-full">
              Preview Schedule
            </Button>
            
            {newSchedule.length > 0 && (
              <div className="mt-4 flex flex-col gap-5 border-t border-slate-200/20 pt-6">
                <div className="max-h-[300px] overflow-auto rounded-lg border border-slate-200/30">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50/10">
                        <TableHead className="w-12">No.</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {newSchedule.map((s, idx) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium text-slate-500">{idx + 1}</TableCell>
                          <TableCell>
                            <Input 
                              type="date" 
                              value={s.scheduledDate} 
                              onChange={e => updateScheduleItem(idx, "scheduledDate", e.target.value)}
                              className="h-8 text-sm"
                            />
                          </TableCell>
                          <TableCell>
                            <Input 
                              type="number" 
                              step="0.01"
                              value={s.scheduledAmount} 
                              onChange={e => updateScheduleItem(idx, "scheduledAmount", e.target.value)}
                              className="h-8 text-sm"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-between items-center p-4 bg-slate-50/10 rounded-xl border border-slate-200/20">
                  <span className="text-sm font-medium text-slate-500">New Total:</span>
                  <span className={`font-serif text-xl font-bold ${newScheduleTotal < outstanding ? 'text-destructive' : 'text-navy-900'}`}>
                    {newScheduleTotal.toFixed(2)}
                  </span>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label className="text-slate-500">Reason for Restructure</Label>
                  <Textarea 
                    value={reason} 
                    onChange={e => setReason(e.target.value)} 
                    placeholder="Provide a detailed reason..."
                    rows={3}
                  />
                </div>
                
                {error && <p className="text-destructive text-sm font-medium">{error}</p>}
                
                <Button 
                  onClick={handleSubmit} 
                  disabled={isSubmitting}
                  className="w-full"
                >
                  {isSubmitting ? "Submitting..." : "Apply Restructure"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
