import type { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const authConfig = {
  session: { strategy: "jwt" },
  providers: [
    // This will be overridden or expanded in auth.ts
    // We just need a placeholder config for edge compatibility
  ],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user
      const protectedPaths = ['/app/dashboard', '/app/branches', '/app/centres', '/app/members', '/app/loans', '/app/collection', '/app/reports', '/app/loan-products', '/app/settings']
      const isProtected = protectedPaths.some(p => nextUrl.pathname.startsWith(p))
      
      if (isProtected) {
        if (isLoggedIn) return true
        return Response.redirect(new URL('/app/login', nextUrl))
      } else if (isLoggedIn && (nextUrl.pathname === '/app/login' || nextUrl.pathname === '/app/signup')) {
        return Response.redirect(new URL('/app/dashboard', nextUrl))
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
        token.organizationId = (user as any).organizationId
        token.branchId = (user as any).branchId
      }
      if (token.role === "ADMIN") {
        token.role = "SYSTEM_ADMIN"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string | null;
        (session.user as any).branchId = token.branchId as string | null;
      }
      return session
    }
  }
} satisfies NextAuthConfig
