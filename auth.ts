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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string }
        })

        // Always compare to prevent timing side-channel that leaks user existence
        const DUMMY_HASH = '$2b$10$invalidhashpaddingtomakethisexactlythesamelengthasreal'
        const passwordsMatch = await bcrypt.compare(
          credentials.password as string,
          user?.password ?? DUMMY_HASH
        )

        if (!user || !passwordsMatch) return null

        const { password, ...safeUser } = user
        return safeUser
      }
    })
  ]
})
