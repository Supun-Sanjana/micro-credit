import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

const secretKey = process.env.AUTH_SECRET || "dev-secret-do-not-use-in-prod"
const key = new TextEncoder().encode(secretKey)

export async function createAdminSession(adminId: string, email: string) {
  const expires = new Date(Date.now() + 10 * 60 * 60 * 1000) // 10 hours
  const session = await new SignJWT({ adminId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("10h")
    .sign(key)

  cookies().set("admin_session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  })
}

export async function verifyAdminSession() {
  const cookie = cookies().get("admin_session")?.value
  if (!cookie) return null

  try {
    const { payload } = await jwtVerify(cookie, key, {
      algorithms: ["HS256"],
    })
    return payload as { adminId: string; email: string }
  } catch (error) {
    return null
  }
}

export function clearAdminSession() {
  cookies().set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  })
}
