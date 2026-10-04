import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"

function getAdminKey() {
  const secretKey = process.env.AUTH_SECRET
  if (!secretKey) throw new Error("AUTH_SECRET is not set in environment variables")
  // Use a distinct key for admin sessions to prevent cross-context privilege escalation
  return new TextEncoder().encode(secretKey + "::platform-admin")
}

export async function createAdminSession(adminId: string, email: string) {
  const expires = new Date(Date.now() + 10 * 60 * 60 * 1000) // 10 hours
  const session = await new SignJWT({ adminId, email })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("10h")
    .sign(getAdminKey())

  ;(await cookies()).set("admin_session", session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires,
    path: "/",
  })
}

export async function verifyAdminSession() {
  const cookie = (await cookies()).get("admin_session")?.value
  if (!cookie) return null

  try {
    const { payload } = await jwtVerify(cookie, getAdminKey(), {
      algorithms: ["HS256"],
    })
    return payload as { adminId: string; email: string }
  } catch (error) {
    return null
  }
}

export async function clearAdminSession() {
  ;(await cookies()).set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: new Date(0),
    path: "/",
  })
}
