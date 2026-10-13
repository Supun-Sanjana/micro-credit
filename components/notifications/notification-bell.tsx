"use client"

import { useState, useEffect, useRef, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Bell, CheckCheck, Settings, ExternalLink, 
  CheckCircle2, AlertTriangle, DollarSign, 
  FileWarning, RefreshCw, X, ShieldAlert, Award
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { NotificationItem } from "@/app/actions/notifications"

interface NotificationBellProps {
  userId?: string
}

export function NotificationBell({ userId }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const storageKey = `solida_read_notifications_${userId || "default"}`

  // Load read status from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey)
      if (stored) {
        setReadIds(new Set(JSON.parse(stored)))
      }
    } catch (e) {
      console.error("Failed to load read notifications:", e)
    }
  }, [storageKey])

  // Save read status to localStorage
  const saveReadIds = (newSet: Set<string>) => {
    setReadIds(newSet)
    try {
      localStorage.setItem(storageKey, JSON.stringify(Array.from(newSet)))
    } catch (e) {
      console.error("Failed to save read notifications:", e)
    }
  }

  const isFetchingRef = useRef(false)

  // Fetch notifications
  const fetchNotifications = async (showRefreshIndicator = false) => {
    if (isFetchingRef.current && !showRefreshIndicator) return
    isFetchingRef.current = true
    if (showRefreshIndicator) setIsRefreshing(true)
    try {
      const res = await fetch("/api/notifications")
      if (res.ok) {
        const data = await res.json()
        if (data?.notifications) {
          setNotifications(data.notifications)
        }
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err)
    } finally {
      isFetchingRef.current = false
      setIsLoading(false)
      if (showRefreshIndicator) setIsRefreshing(false)
    }
  }

  // Fetch once on page load/refresh + gentle 5-minute background interval
  useEffect(() => {
    fetchNotifications()

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchNotifications()
      }
    }, 5 * 60 * 1000) // 5 minutes

    return () => {
      clearInterval(interval)
    }
  }, [])

  // Close dropdown on click outside or escape key
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleKeyDown)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen])

  const unreadCount = notifications.filter(n => !readIds.has(n.id)).length

  const markAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const next = new Set(readIds)
    next.add(id)
    saveReadIds(next)
  }

  const markAllAsRead = () => {
    const next = new Set(readIds)
    notifications.forEach(n => next.add(n.id))
    saveReadIds(next)
  }

  const handleNotificationClick = (item: NotificationItem) => {
    markAsRead(item.id)
    if (item.link) {
      router.push(item.link)
    }
    setIsOpen(false)
  }

  const filteredNotifications = notifications.filter(item => {
    if (activeFilter === "unread") return !readIds.has(item.id)
    return true
  })

  // Format relative time
  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffSec = Math.floor(diffMs / 1000)
      const diffMin = Math.floor(diffSec / 60)
      const diffHr = Math.floor(diffMin / 60)
      const diffDays = Math.floor(diffHr / 24)

      if (diffMin < 1) return "Just now"
      if (diffMin < 60) return `${diffMin}m ago`
      if (diffHr < 24) return `${diffHr}h ago`
      if (diffDays === 1) return "Yesterday"
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    } catch {
      return "Recent"
    }
  }

  const getEventIcon = (eventType: string) => {
    if (eventType === "LOAN_APPROVED") {
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4" />
        </div>
      )
    }
    if (eventType === "PAYMENT_RECEIVED") {
      return (
        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
          <DollarSign className="w-4 h-4" />
        </div>
      )
    }
    if (eventType === "PAYMENT_OVERDUE") {
      return (
        <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
          <AlertTriangle className="w-4 h-4" />
        </div>
      )
    }
    if (eventType === "DOCUMENT_REJECTED") {
      return (
        <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-200">
          <FileWarning className="w-4 h-4" />
        </div>
      )
    }
    if (eventType === "LOAN_SETTLED") {
      return (
        <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-200">
          <Award className="w-4 h-4" />
        </div>
      )
    }
    return (
      <div className="w-8 h-8 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center shrink-0 border border-brand-200">
        <Bell className="w-4 h-4" />
      </div>
    )
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Top Bar Bell Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Notifications"
        aria-expanded={isOpen}
        className={cn(
          "relative p-2 rounded-full text-slate-600 dark:text-slate-300 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1",
          isOpen && "bg-slate-100 dark:bg-slate-800 text-navy-900 dark:text-white"
        )}
      >
        <Bell className="w-5 h-5" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-slate-900">
            {unreadCount > 9 ? "9+" : unreadCount}
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-30" />
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-[-70px] sm:right-0 mt-2 w-[320px] sm:w-[400px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-3 sm:px-4 py-2.5 sm:py-3.5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 dark:text-slate-100 text-[14px] sm:text-[15px]">Notifications</span>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                  {unreadCount} new
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  All caught up
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchNotifications(true)}
                title="Refresh notifications"
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-brand-600 dark:text-brand-400")} />
              </button>
              <Link
                href="/app/settings/notifications"
                onClick={() => setIsOpen(false)}
                title="Notification Settings"
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-3 sm:px-4 pt-2 pb-2 flex items-center justify-between border-b border-slate-100 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveFilter("all")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors",
                  activeFilter === "all"
                    ? "bg-slate-100 dark:bg-slate-800 text-navy-900 dark:text-slate-100 font-semibold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveFilter("unread")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors",
                  activeFilter === "unread"
                    ? "bg-slate-100 dark:bg-slate-800 text-navy-900 dark:text-slate-100 font-semibold"
                    : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                )}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] text-brand-600 dark:text-brand-400 hover:text-brand-800 dark:hover:text-brand-300 font-medium transition-colors px-1 py-0.5 rounded hover:bg-brand-50 dark:hover:bg-brand-950"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[320px] sm:max-h-[400px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 overscroll-contain">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 items-start animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 dark:bg-slate-850 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 mx-auto flex items-center justify-center mb-2.5">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-[13px] font-medium text-slate-700 dark:text-slate-200">No notifications to display</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  {activeFilter === "unread" ? "You've read all your notifications." : "No notifications have been recorded yet."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isUnread = !readIds.has(item.id)
                return (
                  <div
                    key={item.id}
                    onClick={() => handleNotificationClick(item)}
                    className={cn(
                      "px-3 sm:px-4 py-2.5 sm:py-3 flex gap-2 sm:gap-3 items-start hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors relative group",
                      isUnread && "bg-brand-50/20 dark:bg-brand-950/20"
                    )}
                  >
                    {getEventIcon(item.eventType)}

                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-baseline justify-between gap-1 mb-0.5">
                        <p className={cn(
                          "text-[13px] leading-snug truncate",
                          isUnread ? "font-semibold text-navy-950 dark:text-white" : "font-normal text-slate-700 dark:text-slate-300"
                        )}>
                          {item.subject}
                        </p>
                      </div>

                      {item.message && item.message !== item.subject && (
                        <p className="text-[12px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-1">
                          {item.message}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-slate-400 dark:text-slate-500">
                        <span>{formatRelativeTime(item.createdAt)}</span>
                        {item.link && (
                          <Link
                            href={item.link}
                            onClick={(e) => {
                              e.stopPropagation()
                              markAsRead(item.id)
                              setIsOpen(false)
                            }}
                            className="text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 hover:underline inline-flex items-center gap-0.5 font-medium z-10 cursor-pointer"
                          >
                            View details
                            <ExternalLink className="w-2.5 h-2.5" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Unread indicator / Mark read toggle */}
                    <div className="shrink-0 flex items-center self-center">
                      {isUnread ? (
                        <button
                          onClick={(e) => markAsRead(item.id, e)}
                          title="Mark as read"
                          className="w-2.5 h-2.5 rounded-full bg-brand-600 dark:bg-brand-500 hover:scale-125 transition-transform"
                        />
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-3 sm:px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="text-[11px]">Solida Notification Center</span>
            <Link
              href="/app/settings/notifications"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 font-medium hover:underline inline-flex items-center gap-1"
            >
              Preferences
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
