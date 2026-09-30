"use client"

import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

interface AccessGateProps {
  status: string
  isRestricted?: boolean
}

export function AccessGate({ status, isRestricted }: AccessGateProps) {
  const pathname = usePathname()
  const router = useRouter()

  const shouldBlock = isRestricted || status === "SUSPENDED" || status === "CANCELLED"

  useEffect(() => {
    if (shouldBlock && !pathname.startsWith("/app/settings/billing")) {
      router.replace("/app/settings/billing")
    }
  }, [shouldBlock, pathname, router])

  return null
}
