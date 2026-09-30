"use client"

import { useState } from "react"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

export interface MonthlyFlowPoint {
  month: string
  lending: number
  repayment: number
}

interface FinancialChartProps {
  data6Months?: MonthlyFlowPoint[]
  dataThisYear?: MonthlyFlowPoint[]
}

export function FinancialChart({ data6Months = [], dataThisYear = [] }: FinancialChartProps) {
  const [filter, setFilter] = useState<"6M" | "1Y">("6M")

  const currentData = filter === "6M" ? data6Months : dataThisYear

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-[20px] font-serif font-medium tracking-tight text-ink-black">Financial Flow</h2>
          <p className="text-[13px] text-slate-500 mt-0.5">Live disbursements and collections over time</p>
        </div>
        <select 
          value={filter}
          onChange={(e) => setFilter(e.target.value as "6M" | "1Y")}
          className="bg-[#f8f9fa] border border-slate-200 text-[13px] font-medium text-navy-900 py-2 px-4 rounded-full cursor-pointer hover:bg-[#f0f0f0] transition-colors focus:ring-0 focus:outline-none"
        >
          <option value="6M">Last 6 Months</option>
          <option value="1Y">This Year</option>
        </select>
      </div>

      <div className="h-[300px] w-full mt-4">
        {currentData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-400 text-sm">
            No transaction records found for this period.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={currentData} margin={{ top: 10, right: 20, bottom: 5, left: 10 }}>
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
                tickFormatter={(value) => 
                  new Intl.NumberFormat('en-US', { 
                    notation: 'compact', 
                    compactDisplay: 'short' 
                  }).format(Number(value) || 0)
                }
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1b1b1b', 
                  border: 'none',
                  borderRadius: '12px',
                  color: '#f8f9fa',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                  padding: '10px 14px'
                }}
                itemStyle={{ color: '#f8f9fa', fontSize: '13px', padding: '2px 0' }}
                formatter={(value: any, name: any) => [
                  `LKR ${new Intl.NumberFormat('en-US').format(Number(value) || 0)}`, 
                  name
                ]}
              />
              <Legend 
                verticalAlign="top" 
                align="center"
                height={36} 
                wrapperStyle={{ paddingBottom: '20px' }} 
                iconType="circle" 
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
              <Line 
                type="monotone" 
                dataKey="lending" 
                name="Disbursements"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: '#6366f1' }}
                activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}
