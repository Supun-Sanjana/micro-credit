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
      const pathname = nextUrl.pathname
      
      // Public paths that don't require authentication
      const publicPaths = ['/app/login', '/app/signup', '/app/admin']
      const isPublic = publicPaths.some(p => pathname === p || pathname.startsWith(p + '/'))
      
      // All /app/* routes are protected by default except public paths
      const isAppRoute = pathname.startsWith('/app')
      
      if (isAppRoute && !isPublic) {
        if (isLoggedIn) return true
        return Response.redirect(new URL('/app/login', nextUrl))
      }
      
      // Redirect logged-in users away from login/signup
      if (isLoggedIn && (pathname === '/app/login' || pathname === '/app/signup')) {
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
