import React from "react";
import { TrendingDown, TrendingUp, ChevronDown, X } from "lucide-react";
import { Gauge } from "./gauge";

export function DashboardPreview() {
  return (
    <div className="w-full px-3 sm:px-4 mt-16 sm:mt-24 max-w-[880px] mx-auto z-10 relative">
      <div className="bg-[#f5f2ee] rounded-3xl p-4 sm:p-6 w-full shadow-xl border border-white/40">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-left">
          
          {/* Card 1 — Collection */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[#7c3aed] font-medium text-[13px]">Collection</span>
                <span className="text-neutral-500 text-[13px]">This Month</span>
              </div>
              <div className="flex items-end gap-3 mb-1">
                <span className="text-[28px] font-semibold tracking-tight text-neutral-900 leading-none">
                  4.2M
                </span>
                <div className="flex items-center gap-1 bg-green-50 text-green-700 rounded-full px-2 py-0.5 text-[11px] font-medium">
                  <TrendingUp className="w-3 h-3" />
                  +1.1M (35%)
                </div>
              </div>
              <p className="text-[12px] text-neutral-400">Compared to last month</p>
            </div>
            
            <div className="mt-6 flex flex-col items-center">
              <span className="text-[12px] font-medium text-neutral-700 mb-2">Month Target achieved</span>
              <Gauge value={92} color="#7c3aed" showLabels min={0} max={4.5} />
            </div>
            
            <div className="mt-6 bg-neutral-100/80 p-1 rounded-full flex gap-1 mx-auto w-max">
              <button className="bg-white shadow text-neutral-900 text-[11px] font-medium px-4 py-1.5 rounded-full transition-all">
                Collection
              </button>
              <button className="text-neutral-500 hover:text-neutral-900 text-[11px] font-medium px-4 py-1.5 rounded-full transition-all">
                Disbursements
              </button>
            </div>
          </div>
          
          {/* Card 2 — Target Adjustments */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 flex flex-col gap-5">
            <div className="flex justify-between items-center mb-1">
              <span className="text-[#7c3aed] font-medium text-[13px]">Adjust Targets</span>
              <button className="text-neutral-400 hover:text-neutral-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-neutral-700">Target period</label>
              <button className="flex items-center justify-between border border-neutral-200 rounded-lg px-3 py-2 text-[13px] text-neutral-800 hover:bg-neutral-50 transition-colors text-left">
                This month
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-neutral-700">Compare period by</label>
              <button className="flex items-center justify-between border border-neutral-200 rounded-lg px-3 py-2 text-[13px] text-neutral-800 hover:bg-neutral-50 transition-colors text-left">
                Month-to-date (MTD)
                <ChevronDown className="w-4 h-4 text-neutral-400" />
              </button>
            </div>
            
            <div className="flex flex-col gap-1.5 mt-2">
              <label className="text-[12px] font-medium text-neutral-700">Branch targets (This month)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[13px]">#</span>
                <input type="text" defaultValue="15" className="w-full border border-neutral-200 rounded-lg pl-7 pr-3 py-2 text-[13px] text-neutral-800 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all" />
              </div>
            </div>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-medium text-neutral-700">Branch targets (This year)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[13px]">#</span>
                <input type="text" defaultValue="180" className="w-full border border-neutral-200 rounded-lg pl-7 pr-3 py-2 text-[13px] text-neutral-800 focus:outline-none focus:border-[#7c3aed] focus:ring-1 focus:ring-[#7c3aed] transition-all" />
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-auto pt-2">
              <button className="bg-[#7c3aed] text-white text-[13px] font-medium rounded-lg px-5 py-2 hover:bg-[#6d28d9] transition-colors shadow-sm">
                Save
              </button>
              <button className="text-[13px] font-medium text-neutral-500 hover:text-neutral-800 underline underline-offset-2 transition-colors">
                Cancel
              </button>
            </div>
          </div>
          
          {/* Card 3 — New Members */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 flex flex-col justify-between sm:hidden lg:flex">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-[#7c3aed] font-medium text-[13px]">New Members</span>
                <span className="text-neutral-500 text-[13px]">today</span>
              </div>
              <div className="flex items-end gap-3 mb-1">
                <span className="text-[28px] font-semibold tracking-tight text-neutral-900 leading-none">
                  142
                </span>
                <div className="flex items-center gap-1 bg-green-50 text-green-700 rounded-full px-2 py-0.5 text-[11px] font-medium">
                  <TrendingUp className="w-3 h-3" />
                  +18 (14%)
                </div>
              </div>
              <p className="text-[12px] text-neutral-400">Compared to yesterday</p>
            </div>
            
            <div className="mt-6 flex flex-col items-center">
              <Gauge value={68} color="#9ca3af" showLabels={false} />
            </div>
            
            <div className="mt-6 bg-neutral-100/80 p-1 rounded-full flex gap-1 mx-auto w-max">
              <button className="text-neutral-500 hover:text-neutral-900 text-[11px] font-medium px-4 py-1.5 rounded-full transition-all">
                Guarantors
              </button>
              <button className="bg-white shadow text-neutral-900 text-[11px] font-medium px-4 py-1.5 rounded-full transition-all">
                Members
              </button>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
