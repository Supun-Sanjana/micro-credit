"use client"

import { useFormState, useFormStatus } from "react-dom"
import { authenticate } from "@/app/actions/auth"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { useState } from "react"

export default function LoginPage() {
  const [errorMessage, formAction] = useFormState(
    authenticate,
    undefined,
  )
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#ffffff] p-4 font-sans">
      
      {/* Floating Product Artifact (Login Card) */}
      <div 
        className="w-full max-w-[440px] bg-[#ffffff] rounded-[20px] p-[40px] flex flex-col"
        style={{
          boxShadow: 'rgba(4, 23, 43, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.1) 0px 8px 10px -6px'
        }}
      >
        
        <div className="text-center mb-10">
          <h1 
            className="text-[44px] leading-[1.3] text-[#17191c] font-serif font-normal"
            style={{ letterSpacing: '-0.66px' }}
          >
            Welcome back
          </h1>
          <p className="text-[17px] leading-[1.35] text-[#777b86] mt-2">
            Sign in to your Solida workspace to continue
          </p>
        </div>
        
        <form action={formAction} className="flex flex-col space-y-[24px]">
          
          <div className="flex flex-col space-y-2">
            <label htmlFor="email" className="text-[15px] text-[#17191c] font-medium ml-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="admin@micro.local"
              className="bg-[#ffffff] border border-[#ececec] rounded-[16px] p-[16px] text-[16px] text-[#17191c] placeholder:text-[#a3a6af] outline-none focus:border-[#17191c] transition-colors"
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <div className="flex items-center justify-between ml-1">
              <label htmlFor="password" className="text-[15px] text-[#17191c] font-medium">
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                className="w-full bg-[#ffffff] border border-[#ececec] rounded-[16px] pl-[16px] pr-[48px] py-[16px] text-[16px] text-[#17191c] placeholder:text-[#a3a6af] outline-none focus:border-[#17191c] transition-colors tracking-widest placeholder:tracking-normal"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a3a6af] hover:text-[#17191c] transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-[16px] bg-[#fbe1d1] p-[16px] text-[15px] text-[#5d2a1a] font-medium text-center border border-[#5d2a1a]/10">
              {errorMessage}
            </div>
          )}

          <div className="pt-4">
            <SubmitButton />
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[15px] text-[#777b86]">
            Don&apos;t have an account?{" "}
            <a href="#" className="text-[#17191c] hover:underline underline-offset-4 ml-1">
              Contact Admin →
            </a>
          </p>
        </div>

      </div>
    </div>
  )
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full flex items-center justify-center bg-[#17191c] text-[#ffffff] rounded-full px-[20px] py-[16px] text-[16px] font-normal transition-opacity hover:opacity-90 disabled:opacity-50"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Signing in...
        </>
      ) : (
        "Sign in"
      )}
    </button>
  )
}
