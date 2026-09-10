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
      const protectedPaths = ['/dashboard', '/branches', '/centres', '/members', '/loans', '/collection', '/reports', '/loan-products', '/admin']
      const isProtected = protectedPaths.some(p => nextUrl.pathname.startsWith(p))
      
      if (isProtected) {
        if (isLoggedIn) return true
        return Response.redirect(new URL('/login', nextUrl))
      } else if (isLoggedIn && nextUrl.pathname === '/login') {
        return Response.redirect(new URL('/dashboard', nextUrl))
      }
      return true
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
        token.organizationId = user.organizationId
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string | null
      }
      return session
    }
  }
} satisfies NextAuthConfig
