"use server"

import prisma from "@/lib/prisma"
import bcrypt from "bcrypt"
import { createAdminSession } from "@/lib/admin-session"
import { logAdminAction } from "@/lib/admin-audit"
import { redirect } from "next/navigation"

import { checkRateLimit, recordFailedLogin, clearFailedLogins } from "@/lib/rate-limit"

export async function loginAdmin(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string
  const token = formData.get("token") as string // for 2FA

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  try {
    await checkRateLimit(email)
  } catch (error: any) {
    return { error: error.message }
  }

  const admin = await prisma.platformAdmin.findUnique({
    where: { email }
  })

  if (!admin) {
    await recordFailedLogin(email)
    return { error: "Invalid credentials" }
  }

  const isValid = await bcrypt.compare(password, admin.password)
  if (!isValid) {
    await recordFailedLogin(email)
    return { error: "Invalid credentials" }
  }

  // A1.2: Check 2FA if enabled
  if (admin.totpEnabled && admin.totpSecret) {
    if (!token) {
      return { requiresTwoFactor: true }
    }
    
    // otplib v12+ exports TOTP class directly, not the legacy authenticator helper
    const { TOTP } = await import("otplib")
    const totp = new TOTP()
    const isTokenValid = await totp.verify(token, { secret: admin.totpSecret })
    
    if (!isTokenValid) {
      await recordFailedLogin(email)
      return { error: "Invalid 2FA code", requiresTwoFactor: true }
    }
  }

  // Create isolated session
  await createAdminSession(admin.id, admin.email)

  // Log the login action (Audit)
  await logAdminAction({
    platformAdminId: admin.id,
    action: "LOGIN",
    targetType: "PlatformAdmin",
    targetId: admin.id,
    note: "Platform Admin logged in successfully"
  })

  await clearFailedLogins(email)
  redirect("/app/admin")
}

export async function logoutAdmin() {
  const { clearAdminSession } = await import("@/lib/admin-session")
  clearAdminSession()
  redirect("/app/admin/login")
}
