import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { jwtVerify } from "jose"

const nextAuthMiddleware = NextAuth(authConfig).auth

export default async function middleware(req: any) {
  const { nextUrl } = req

  // Intercept /admin paths for Platform Admin auth
  if (nextUrl.pathname.startsWith("/admin") && !nextUrl.pathname.startsWith("/admin/login")) {
    const cookie = req.cookies.get("admin_session")?.value
    if (!cookie) {
      return Response.redirect(new URL("/admin/login", nextUrl))
    }
    
    try {
      const secret = process.env.AUTH_SECRET
      if (!secret) throw new Error("AUTH_SECRET is not set in environment variables")
      await jwtVerify(cookie, new TextEncoder().encode(secret), {
        algorithms: ["HS256"],
      })
    } catch (err: any) {
      // Only swallow JWT verification failures (invalid/expired token). Hard config errors must propagate.
      if (err?.message === "AUTH_SECRET is not set in environment variables") throw err
      return Response.redirect(new URL("/admin/login", nextUrl))
    }
  }

  // Fallback to NextAuth for everything else
  return nextAuthMiddleware(req)
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
