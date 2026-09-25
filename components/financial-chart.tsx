"use client"
import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

const data6Months = [
  { month: 'Jul', lending: 450000, repayment: 320000 },
  { month: 'Aug', lending: 520000, repayment: 410000 },
  { month: 'Sep', lending: 380000, repayment: 480000 },
  { month: 'Oct', lending: 610000, repayment: 520000 },
  { month: 'Nov', lending: 750000, repayment: 680000 },
  { month: 'Dec', lending: 590000, repayment: 710000 },
]

const dataThisYear = [
  { month: 'Jan', lending: 250000, repayment: 200000 },
  { month: 'Feb', lending: 320000, repayment: 250000 },
  { month: 'Mar', lending: 400000, repayment: 310000 },
  { month: 'Apr', lending: 420000, repayment: 380000 },
  { month: 'May', lending: 500000, repayment: 410000 },
  { month: 'Jun', lending: 550000, repayment: 480000 },
  { month: 'Jul', lending: 450000, repayment: 320000 },
  { month: 'Aug', lending: 520000, repayment: 410000 },
  { month: 'Sep', lending: 380000, repayment: 480000 },
  { month: 'Oct', lending: 610000, repayment: 520000 },
  { month: 'Nov', lending: 750000, repayment: 680000 },
  { month: 'Dec', lending: 590000, repayment: 710000 },
]

export function FinancialChart() {
  const [filter, setFilter] = useState("6M")

  const currentData = filter === "6M" ? data6Months : dataThisYear

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-[20px] font-serif font-medium tracking-tight">Financial Flow</h2>
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="bg-[#f8f9fa] border-none text-[13px] font-medium text-navy-900 py-2 px-4 rounded-full cursor-pointer hover:bg-[#f0f0f0] transition-colors focus:ring-0"
        >
          <option value="6M">Last 6 Months</option>
          <option value="1Y">This Year</option>
        </select>
      </div>

      <div className="h-[300px] w-full mt-6">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={currentData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ececec" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8f939b', fontSize: 13 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#8f939b', fontSize: 13 }}
              dx={-10}
              tickFormatter={(value) => new Intl.NumberFormat('en-US', { notation: 'compact', compactDisplay: 'short' }).format(value as number)}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1b1b1b', 
                border: 'none',
                borderRadius: '12px',
                color: '#f8f9fa',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
              }}
              itemStyle={{ color: '#f8f9fa', fontSize: '14px' }}
              formatter={(value: any, name: any) => [new Intl.NumberFormat('en-US').format(value), name]}
            />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingBottom: '20px' }} iconType="circle" />
            <Line 
              type="monotone" 
              dataKey="lending" 
              name="Disbursements"
              stroke="#6366f1"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#6366f1' }}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
            />
            <Line 
              type="monotone" 
              dataKey="repayment" 
              name="Collections"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#10b981' }}
              activeDot={{ r: 6, strokeWidth: 0, fill: '#10b981' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
