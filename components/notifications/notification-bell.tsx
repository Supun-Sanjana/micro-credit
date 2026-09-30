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

  // Fetch notifications
  const fetchNotifications = async (showRefreshIndicator = false) => {
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
      setIsLoading(false)
      if (showRefreshIndicator) setIsRefreshing(false)
    }
  }

  // Initial fetch and auto-polling
  useEffect(() => {
    fetchNotifications()

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        fetchNotifications()
      }
    }, 30000)

    const handleFocus = () => fetchNotifications()
    window.addEventListener("focus", handleFocus)

    return () => {
      clearInterval(interval)
      window.removeEventListener("focus", handleFocus)
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
    setIsOpen(false)
    if (item.link) {
      router.push(item.link)
    }
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
          "relative p-2 rounded-full text-slate-600 hover:text-navy-900 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1",
          isOpen && "bg-slate-100 text-navy-900"
        )}
      >
        <Bell className="w-5 h-5" />
        
        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-30" />
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[340px] sm:w-[400px] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-[15px]">Notifications</span>
              {unreadCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-100 text-rose-700">
                  {unreadCount} new
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                  All caught up
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchNotifications(true)}
                title="Refresh notifications"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", isRefreshing && "animate-spin text-brand-600")} />
              </button>
              <Link
                href="/app/settings/notifications"
                onClick={() => setIsOpen(false)}
                title="Notification Settings"
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="px-4 pt-2.5 pb-2 flex items-center justify-between border-b border-slate-100 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveFilter("all")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors",
                  activeFilter === "all"
                    ? "bg-slate-100 text-navy-900 font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                All ({notifications.length})
              </button>
              <button
                onClick={() => setActiveFilter("unread")}
                className={cn(
                  "px-2.5 py-1 rounded-md font-medium transition-colors",
                  activeFilter === "unread"
                    ? "bg-slate-100 text-navy-900 font-semibold"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                Unread ({unreadCount})
              </button>
            </div>

            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[11px] text-brand-600 hover:text-brand-800 font-medium transition-colors px-1 py-0.5 rounded hover:bg-brand-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 overscroll-contain">
            {isLoading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3 items-start animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-100 rounded w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="py-10 px-4 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-2.5">
                  <Bell className="w-5 h-5" />
                </div>
                <p className="text-[13px] font-medium text-slate-700">No notifications to display</p>
                <p className="text-xs text-slate-400 mt-0.5">
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
                      "px-4 py-3 flex gap-3 items-start hover:bg-slate-50 cursor-pointer transition-colors relative group",
                      isUnread && "bg-brand-50/20"
                    )}
                  >
                    {getEventIcon(item.eventType)}

                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-baseline justify-between gap-1 mb-0.5">
                        <p className={cn(
                          "text-[13px] leading-snug truncate",
                          isUnread ? "font-semibold text-navy-950" : "font-normal text-slate-700"
                        )}>
                          {item.subject}
                        </p>
                      </div>

                      {item.message && item.message !== item.subject && (
                        <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed mb-1">
                          {item.message}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{formatRelativeTime(item.createdAt)}</span>
                        {item.link && (
                          <span className="text-brand-600 group-hover:underline inline-flex items-center gap-0.5">
                            View details
                            <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Unread indicator / Mark read toggle */}
                    <div className="shrink-0 flex items-center self-center">
                      {isUnread ? (
                        <button
                          onClick={(e) => markAsRead(item.id, e)}
                          title="Mark as read"
                          className="w-2.5 h-2.5 rounded-full bg-brand-600 hover:scale-125 transition-transform"
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
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 px-4">
            <span className="text-[11px]">Solida Notification Center</span>
            <Link
              href="/app/settings/notifications"
              onClick={() => setIsOpen(false)}
              className="text-[11px] text-brand-600 hover:text-brand-700 font-medium hover:underline inline-flex items-center gap-1"
            >
              Preferences
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
