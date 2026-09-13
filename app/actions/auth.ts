"use server"

import { signIn } from "@/auth"
import { AuthError } from "next-auth"

import { checkRateLimit } from "@/lib/rate-limit"

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  const email = formData.get("email") as string
  if (email) {
    try {
      await checkRateLimit(email)
    } catch (error: any) {
      return error.message
    }
  }

  try {
    formData.append("redirectTo", "/dashboard")
    await signIn("credentials", formData)
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Invalid credentials."
        default:
          return "Something went wrong."
      }
    }
    throw error
  }
}
