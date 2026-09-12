"use client"

import { mockLoans, mockCashFlows, mockMembers } from "@/lib/mock-data"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

// Simple mock financial activity data for the chart
const financialData = [
  { month: 'Jan', lending: 450000, repayment: 320000 },
  { month: 'Feb', lending: 520000, repayment: 410000 },
  { month: 'Mar', lending: 380000, repayment: 480000 },
  { month: 'Apr', lending: 610000, repayment: 520000 },
  { month: 'May', lending: 750000, repayment: 680000 },
  { month: 'Jun', lending: 590000, repayment: 710000 },
]

export default function DashboardPage() {
  const activeLoans = mockLoans.filter(l => l.status === "ACTIVE")
  const totalOutstanding = activeLoans.reduce((acc, loan) => acc + Number(loan.outstanding), 0)
  const todayCollectionsDue = mockCashFlows.reduce((acc, cf) => acc + Number(cf.recoveryAmount), 0)
  const totalMembers = mockMembers.length

  return (
    <div className="flex flex-col gap-[80px]">
      
      {/* Hero Section */}
      <div className="flex flex-col gap-4">
        <h1 
          className="text-[64px] leading-[1.3] text-ink-black font-serif font-normal"
          style={{ letterSpacing: '-0.96px' }}
        >
          Performance Overview
        </h1>
        <p className="text-[18px] text-slate-gray max-w-[600px] leading-[1.5]">
          A high-level view of active capital, weekly collections, and overall portfolio health across all operational branches.
        </p>
      </div>

      {/* Floating Artifact Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="Active Capital" value={`LKR ${(totalOutstanding / 1000).toFixed(1)}k`} delta="↑ 12% vs last quarter" />
        <StatCard title="Today's Collections" value={`LKR ${(todayCollectionsDue / 1000).toFixed(1)}k`} delta="↑ 4.2% vs last week" />
        <StatCard title="Registered Members" value={totalMembers.toString()} delta="↑ 8 new this week" />
      </div>

      {/* Main Financial Chart - Floating Artifact */}
      <div className="bg-paper-white rounded-[20px] shadow-subtle-3 p-[32px] pt-[24px]">
        <div className="mb-8">
          <h2 className="text-[26px] font-sans font-medium text-ink-black tracking-[-0.23px]">
            Capital Flow
          </h2>
          <p className="text-[15px] text-slate-gray mt-1">
            Lending volume versus repayment recovery over the last 6 months.
          </p>
        </div>
        
        <div className="h-[360px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={financialData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f2f2f3" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#979799', fontSize: 14 }}
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: '#979799', fontSize: 14 }}
                tickFormatter={(value) => `Rs${value / 1000}k`}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', padding: '16px' }}
                itemStyle={{ color: '#17191c', fontSize: '15px' }}
                labelStyle={{ color: '#777b86', marginBottom: '8px' }}
              />
              {/* Lending - Ink Black */}
              <Line 
                type="monotone" 
                dataKey="lending" 
                name="Lending"
                stroke="#17191c" 
                strokeWidth={2} 
                dot={{ fill: '#17191c', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#17191c' }} 
              />
              {/* Repayment - Sienna Brown */}
              <Line 
                type="monotone" 
                dataKey="repayment" 
                name="Repayment"
                stroke="#5d2a1a" 
                strokeWidth={2} 
                dot={{ fill: '#5d2a1a', r: 4, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: '#5d2a1a' }} 
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Custom Legend */}
        <div className="flex items-center gap-6 mt-6 justify-center">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-ink-black"></div>
            <span className="text-[14px] text-slate-gray">Lending Volume</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-sienna-brown"></div>
            <span className="text-[14px] text-slate-gray">Repayment Recovery</span>
          </div>
        </div>
      </div>

    </div>
  )
}

function StatCard({ title, value, delta }: { title: string, value: string, delta: string }) {
  return (
    <div className="bg-paper-white rounded-[20px] shadow-subtle-3 p-[24px]">
      <p className="text-[14px] text-slate-gray font-sans mb-3">{title}</p>
      <div className="text-[32px] font-medium text-ink-black tracking-[-0.5px] leading-none mb-4">
        {value}
      </div>
      <p className="text-[14px] text-sienna-brown bg-blush-peach/40 inline-flex px-2 py-1 rounded-md font-medium">
        {delta}
      </p>
    </div>
  )
}
