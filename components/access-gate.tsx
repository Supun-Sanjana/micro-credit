"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

interface AccessGateProps {
  status: string
}

export function AccessGate({ status }: AccessGateProps) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (status === "SUSPENDED" && !pathname.startsWith("/app/settings/billing")) {
      router.push("/app/settings/billing")
    }
  }, [status, pathname, router])

  return null
}
