import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { PrismaAdapter } from "@auth/prisma-adapter"
import prisma from "./lib/prisma"
import bcrypt from "bcrypt"
import { authConfig } from "./auth.config"

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        
        const email = credentials.email as string
        const { checkRateLimit, recordFailedLogin, clearFailedLogins } = await import("./lib/rate-limit")

        try {
          await checkRateLimit(email)
        } catch (e: any) {
          throw new Error(e.message) // NextAuth will catch this
        }

        const user = await prisma.user.findUnique({
          where: { email }
        })

        // Always compare to prevent timing side-channel that leaks user existence
        const DUMMY_HASH = '$2b$10$invalidhashpaddingtomakethisexactlythesamelengthasreal'
        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user?.password ?? DUMMY_HASH
        )

        if (!user || !passwordsMatch) {
          await recordFailedLogin(email)
          return null
        }

        await clearFailedLogins(email)
        const { password, ...safeUser } = user
        return safeUser
      }
    })
  ]
})
