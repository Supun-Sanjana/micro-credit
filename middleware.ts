import NextAuth from "next-auth"
import { authConfig } from "./auth.config"
import { jwtVerify } from "jose"
import { NextResponse } from "next/server"

const nextAuthMiddleware = NextAuth(authConfig).auth

export default async function middleware(req: any) {
  const { nextUrl } = req

  // Intercept /app/admin paths for Platform Admin auth
  if (nextUrl.pathname.startsWith("/app/admin") && !nextUrl.pathname.startsWith("/app/admin/login")) {
    const cookie = req.cookies.get("admin_session")?.value
    if (!cookie) {
      return Response.redirect(new URL("/app/admin/login", nextUrl))
    }
    
    try {
      const secret = process.env.AUTH_SECRET
      if (!secret) throw new Error("AUTH_SECRET is not set in environment variables")
      await jwtVerify(cookie, new TextEncoder().encode(secret + "::platform-admin"), {
        algorithms: ["HS256"],
      })
    } catch (err: any) {
      // Only swallow JWT verification failures (invalid/expired token). Hard config errors must propagate.
      if (err?.message === "AUTH_SECRET is not set in environment variables") throw err
      return Response.redirect(new URL("/app/admin/login", nextUrl))
    }
  }

  // Fallback to NextAuth for everything else
  const res: any = await nextAuthMiddleware(req)
  if (res && (res.status === 302 || res.status === 307 || res.headers?.get?.("location"))) {
    return res
  }

  const requestHeaders = new Headers(req.headers)
  requestHeaders.set("x-pathname", nextUrl.pathname)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/app/:path*'],
}
