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
    if (status === "SUSPENDED" && !pathname.startsWith("/settings/billing")) {
      router.push("/settings/billing")
    }
  }, [status, pathname, router])

  return null
}
