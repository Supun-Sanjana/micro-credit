"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, Eye, EyeOff } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    orgName: "",
    adminName: "",
    email: "",
    password: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to create account.")
      }

      // Success: redirect to login
      router.push("/login?signup=success")
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#ffffff] p-4 font-sans selection:bg-blush-peach selection:text-sienna-brown">
      {/* Floating Product Artifact (Signup Card) */}
      <div
        className="w-full max-w-[460px] bg-[#ffffff] rounded-[20px] p-[40px] flex flex-col my-8"
        style={{
          boxShadow:
            "rgba(4, 23, 43, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 20px 25px -5px, rgba(0, 0, 0, 0.1) 0px 8px 10px -6px",
        }}
      >
        <div className="text-center mb-8">
          <h1
            className="text-[38px] leading-[1.25] text-[#17191c] font-serif font-normal"
            style={{ letterSpacing: "-0.66px" }}
          >
            Create your account
          </h1>
          <p className="text-[16px] leading-[1.4] text-[#777b86] mt-2">
            Start your 14-day free trial of Solida
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col space-y-[20px]">
          <div className="flex flex-col space-y-2">
            <label
              htmlFor="orgName"
              className="text-[15px] text-[#17191c] font-medium ml-1"
            >
              Organization name
            </label>
            <input
              id="orgName"
              name="orgName"
              type="text"
              required
              value={formData.orgName}
              onChange={handleChange}
              placeholder="e.g. Ruhuna Micro Credit"
              className="bg-[#ffffff] border border-[#ececec] rounded-[16px] p-[16px] text-[16px] text-[#17191c] placeholder:text-[#a3a6af] outline-none focus:border-[#17191c] transition-colors"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label
              htmlFor="adminName"
              className="text-[15px] text-[#17191c] font-medium ml-1"
            >
              Administrator full name
            </label>
            <input
              id="adminName"
              name="adminName"
              type="text"
              required
              value={formData.adminName}
              onChange={handleChange}
              placeholder="e.g. Kasun Perera"
              className="bg-[#ffffff] border border-[#ececec] rounded-[16px] p-[16px] text-[16px] text-[#17191c] placeholder:text-[#a3a6af] outline-none focus:border-[#17191c] transition-colors"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label
              htmlFor="email"
              className="text-[15px] text-[#17191c] font-medium ml-1"
            >
              Work email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="kasun@ruhuna.lk"
              className="bg-[#ffffff] border border-[#ececec] rounded-[16px] p-[16px] text-[16px] text-[#17191c] placeholder:text-[#a3a6af] outline-none focus:border-[#17191c] transition-colors"
            />
          </div>

          <div className="flex flex-col space-y-2">
            <label
              htmlFor="password"
              className="text-[15px] text-[#17191c] font-medium ml-1"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
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

          {error && (
            <div className="rounded-[16px] bg-[#fbe1d1] p-[16px] text-[15px] text-[#5d2a1a] font-medium text-center border border-[#5d2a1a]/10">
              {error}
            </div>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center bg-[#17191c] text-[#ffffff] rounded-full px-[20px] py-[16px] text-[16px] font-normal transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Get started"
              )}
            </button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <p className="text-[15px] text-[#777b86]">
            Already have an account?{" "}
            <Link
              href="/login"
              className="text-[#17191c] hover:underline underline-offset-4 ml-1 font-medium"
            >
              Sign in →
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
