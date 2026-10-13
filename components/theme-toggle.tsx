"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { Sun, Moon, Laptop } from "lucide-react"
import { cn } from "@/lib/utils"

interface ThemeToggleProps {
  className?: string
  variant?: "button" | "dropdown" | "compact"
}

export function ThemeToggle({ className, variant = "button" }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  // Avoid hydration mismatch by rendering placeholder until mounted
  if (!mounted) {
    return (
      <div className={cn("w-9 h-9 rounded-full bg-slate-100/50 dark:bg-slate-800/50 animate-pulse", className)} />
    )
  }

  // Quick 1-click toggle for header
  if (variant === "button") {
    const isDark = resolvedTheme === "dark"
    return (
      <button
        type="button"
        onClick={() => setTheme(isDark ? "light" : "dark")}
        aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
        title={`Switch to ${isDark ? "light" : "dark"} mode`}
        className={cn(
          "relative p-2 rounded-full text-slate-600 hover:text-navy-900 hover:bg-slate-100",
          "dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800",
          "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500",
          className
        )}
      >
        <span className="sr-only">Toggle theme</span>
        {isDark ? (
          <Sun className="w-5 h-5 transition-transform duration-300 rotate-0 scale-100 text-amber-400" />
        ) : (
          <Moon className="w-5 h-5 transition-transform duration-300 rotate-0 scale-100 text-slate-700" />
        )}
      </button>
    )
  }

  // Dropdown variant with System / Light / Dark options
  return (
    <div className={cn("relative inline-block text-left", className)} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Theme selection"
      >
        {resolvedTheme === "dark" ? (
          <Moon className="w-4 h-4 text-brand-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
        <span className="text-xs font-medium capitalize">{theme}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-lg p-1 z-50 animate-in fade-in zoom-in-95 duration-150">
          <button
            onClick={() => { setTheme("light"); setIsOpen(false) }}
            className={cn(
              "flex items-center w-full gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors",
              theme === "light"
                ? "bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            Light
          </button>
          <button
            onClick={() => { setTheme("dark"); setIsOpen(false) }}
            className={cn(
              "flex items-center w-full gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors",
              theme === "dark"
                ? "bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <Moon className="w-3.5 h-3.5 text-brand-400" />
            Dark
          </button>
          <button
            onClick={() => { setTheme("system"); setIsOpen(false) }}
            className={cn(
              "flex items-center w-full gap-2 px-3 py-1.5 text-xs rounded-lg transition-colors",
              theme === "system"
                ? "bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold"
                : "text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
            )}
          >
            <Laptop className="w-3.5 h-3.5 text-slate-400" />
            System
          </button>
        </div>
      )}
    </div>
  )
}
