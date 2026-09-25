"use client"
import { WifiOff } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[24px] shadow-subtle-1 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-[#fce8e6] text-[#c5221f] rounded-full flex items-center justify-center mx-auto mb-6">
          <WifiOff className="w-8 h-8" />
        </div>
        <h1 className="text-[24px] font-serif text-navy-900 mb-2">You are offline</h1>
        <p className="text-[15px] text-slate-500 mb-8">
          It looks like you've lost your internet connection. We'll automatically reconnect and sync your field collections when you're back online.
        </p>
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-navy-900 text-white py-3 rounded-xl text-[15px] font-medium"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
