"use client"

import { useState } from "react"
import { loginAdmin } from "@/app/actions/admin-auth"
import { Eye, EyeOff, Loader2 } from "lucide-react"

export default function AdminLoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [requires2FA, setRequires2FA] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    
    try {
      const formData = new FormData(e.currentTarget)
      const res = await loginAdmin(formData)
      
      if (res?.error) {
        setError(res.error)
      }
      
      if (res?.requiresTwoFactor) {
        setRequires2FA(true)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-[40px] rounded-[24px] shadow-subtle-3 w-full max-w-[400px]">
        <h1 className="text-[26px] font-sans font-medium text-navy-900 tracking-[-0.23px] mb-2">
          Platform Admin
        </h1>
        <p className="text-[15px] text-slate-500 mb-8">
          Restricted access. Super admins only.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-slate-400 font-sans uppercase tracking-wider">Email</label>
            <input 
              name="email"
              type="email" 
              required
              className="bg-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-navy-900 outline-none focus:border-navy-900"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-[13px] text-slate-400 font-sans uppercase tracking-wider">Password</label>
            <div className="relative">
              <input 
                name="password"
                type={showPassword ? "text" : "password"} 
                required
                className="w-full bg-white border border-[#ececec] rounded-[16px] pl-[16px] pr-[48px] py-[14px] text-[16px] text-navy-900 outline-none focus:border-navy-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-navy-900 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {requires2FA && (
            <div className="flex flex-col gap-2 mt-2 p-4 bg-slate-50 rounded-[16px]">
              <label className="text-[13px] text-slate-400 font-sans uppercase tracking-wider">2FA Token (Authenticator)</label>
              <input 
                name="token"
                type="text" 
                maxLength={6}
                className="bg-white border border-[#ececec] rounded-[16px] px-[16px] py-[14px] text-[16px] text-navy-900 outline-none focus:border-navy-900 text-center tracking-[0.5em] font-mono"
              />
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="mt-4 flex items-center justify-center bg-navy-900 text-white rounded-full px-[24px] py-[14px] text-[16px] font-sans transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : requires2FA ? (
              "Verify & Login"
            ) : (
              "Sign In"
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
