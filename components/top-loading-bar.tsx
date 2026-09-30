"use client"

import { useEffect, useState, Suspense } from "react"
import { usePathname, useSearchParams } from "next/navigation"

function TopLoadingBarContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)

  // Listen for route changes
  useEffect(() => {
    // When pathname or search params change, complete the progress bar
    if (visible) {
      setProgress(100)
      const timer = setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [pathname, searchParams])

  // Intercept click on links to immediately start progress bar
  useEffect(() => {
    let timer: NodeJS.Timeout

    const startProgress = () => {
      setVisible(true)
      setProgress(20)

      let current = 20
      clearInterval(timer)
      timer = setInterval(() => {
        current += Math.random() * 10
        if (current > 88) {
          clearInterval(timer)
        } else {
          setProgress(Math.floor(current))
        }
      }, 200)
    }

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a")
      if (!target) return

      const href = target.getAttribute("href")
      if (
        href &&
        href.startsWith("/") &&
        !href.startsWith("#") &&
        target.target !== "_blank" &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.shiftKey &&
        !e.altKey
      ) {
        const currentPath = window.location.pathname + window.location.search
        if (href !== currentPath) {
          startProgress()
        }
      }
    }

    // Custom event listeners for manual triggers
    const handleStartEvent = () => startProgress()
    const handleStopEvent = () => {
      setProgress(100)
      setTimeout(() => {
        setVisible(false)
        setProgress(0)
      }, 300)
    }

    document.addEventListener("click", handleClick, { capture: true })
    window.addEventListener("navigation-progress-start", handleStartEvent)
    window.addEventListener("navigation-progress-stop", handleStopEvent)

    return () => {
      document.removeEventListener("click", handleClick, { capture: true })
      window.removeEventListener("navigation-progress-start", handleStartEvent)
      window.removeEventListener("navigation-progress-stop", handleStopEvent)
      clearInterval(timer)
    }
  }, [])

  if (!visible && progress === 0) return null

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-50 h-[3px] pointer-events-none transition-opacity duration-300"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <div
        className="h-full bg-gradient-to-r from-brand-600 via-sky-500 to-brand-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(2,132,199,0.7)]"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? "width 200ms ease-out" : "width 400ms ease",
        }}
      />
    </div>
  )
}

export function TopLoadingBar() {
  return (
    <Suspense fallback={null}>
      <TopLoadingBarContent />
    </Suspense>
  )
}

/**
 * Trigger navigation progress bar manually
 */
export function triggerNavigationProgress(action: "start" | "stop") {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(`navigation-progress-${action}`))
  }
}
