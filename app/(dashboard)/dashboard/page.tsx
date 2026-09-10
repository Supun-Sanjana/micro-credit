"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { mockLoans, mockCashFlows, mockMembers } from "@/lib/mock-data"
import { Users, Banknote, CalendarClock, Activity } from "lucide-react"

export default function DashboardPage() {
  const activeLoans = mockLoans.filter(l => l.status === "ACTIVE")
  const totalOutstanding = activeLoans.reduce((acc, loan) => acc + Number(loan.outstanding), 0)
  const todayCollectionsDue = mockCashFlows.reduce((acc, cf) => acc + Number(cf.recoveryAmount), 0) // rough mock logic
  const totalMembers = mockMembers.length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Overview of organization performance.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeLoans.length}</div>
            <p className="text-xs text-gray-500">Currently running</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Outstanding</CardTitle>
            <Banknote className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">LKR {totalOutstanding.toLocaleString()}</div>
            <p className="text-xs text-gray-500">Across all active loans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today's Collections Due</CardTitle>
            <CalendarClock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">LKR {todayCollectionsDue.toLocaleString()}</div>
            <p className="text-xs text-gray-500">From daily schedule</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMembers}</div>
            <p className="text-xs text-gray-500">Registered in centres</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
