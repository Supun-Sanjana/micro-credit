"use client"

// Providers must be a STATIC import — it wraps children and must be present
// during hydration. Dynamic import of the wrapper breaks React hydration.
import Providers from "./query-provider"
import dynamic from "next/dynamic"

// These are UI-only overlays — safe to load lazily after hydration
const TopLoadingBar = dynamic(
  () => import("@/components/top-loading-bar").then((m) => m.TopLoadingBar),
  { ssr: false }
)

const OfflineSyncManager = dynamic(
  () => import("@/components/OfflineSyncManager").then((m) => m.OfflineSyncManager),
  { ssr: false }
)

export function ClientShell({ children }: { children: React.ReactNode }) {
  return (
    <Providers>
      <TopLoadingBar />
      {children}
      <OfflineSyncManager />
    </Providers>
  )
}
