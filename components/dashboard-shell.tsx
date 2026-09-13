"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Menu, X, LogOut, LayoutDashboard, FileText, 
  Users, DollarSign, Settings, Building, MapPin, 
  Grid, Briefcase, ChevronDown, User as UserIcon
} from "lucide-react"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"

interface DashboardShellProps {
  children: React.ReactNode
  user: any
  orgName: string
}

export function DashboardShell({ children, user, orgName }: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const pathname = usePathname()
  const isAdmin = user?.role === "ADMIN"
  const profileRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const navGroups = [
    {
      name: "Core",
      items: [
        { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/reports", label: "Reports", icon: FileText },
      ],
    },
    {
      name: "Operations",
      items: [
        { href: "/members", label: "Members", icon: Users },
        { href: "/loans", label: "Loans", icon: DollarSign },
        { href: "/collection", label: "Collection", icon: Briefcase },
      ],
    },
    ...(isAdmin ? [{
      name: "Settings",
      items: [
        { href: "/branches", label: "Branches", icon: Building },
        { href: "/centres", label: "Centres", icon: MapPin },
        { href: "/loan-products", label: "Loan Products", icon: Grid },
        { href: "/settings/team", label: "Team", icon: Users },
        { href: "/settings/billing", label: "Billing", icon: Settings },
      ],
    }] : [])
  ]

  const NavContent = () => (
    <div className="flex flex-col gap-6 py-6 px-4">
      {navGroups.map((group) => (
        <div key={group.name} className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-slate-gray uppercase tracking-wider px-3">
            {group.name}
          </h3>
          <div className="flex flex-col gap-1">
            {group.items.map((item) => {
              const isActive = pathname.startsWith(item.href) && (item.href !== "/dashboard" || pathname === "/dashboard")
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-colors",
                    isActive 
                      ? "bg-blush-peach text-sienna-brown" 
                      : "text-ink-black hover:bg-[#fafafa]"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-sienna-brown" : "text-slate-gray")} />
                  {item.label}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-40 bg-paper-white border-b border-[#ececec] px-4 sm:px-6 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 -ml-2 text-ink-black hover:bg-[#fafafa] rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blush-peach rounded-xl flex items-center justify-center border border-[#ececec]">
              <div className="w-5 h-5 border-2 border-sienna-brown rounded-sm transform rotate-45" />
            </div>
            <span className="text-[20px] font-serif font-medium tracking-tight hidden sm:block">
              {orgName}
            </span>
          </Link>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 hover:bg-[#fafafa] p-1.5 rounded-full pr-4 transition-colors border border-transparent hover:border-[#ececec]"
          >
            <div className="w-10 h-10 bg-[#f0f0f0] rounded-full flex items-center justify-center overflow-hidden">
              <UserIcon className="w-5 h-5 text-slate-gray" />
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-[14px] font-medium leading-none">{user?.name || "User"}</span>
              <span className="text-[12px] text-slate-gray mt-1 leading-none">{user?.role === "ADMIN" ? "Admin" : "Officer"}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-gray ml-1" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-[#ececec] rounded-2xl shadow-subtle-3 py-2 z-50">
              <div className="px-4 py-3 border-b border-[#ececec] sm:hidden">
                <p className="text-sm font-medium text-ink-black truncate">{user?.name}</p>
                <p className="text-xs text-slate-gray truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="w-full text-left px-4 py-2.5 text-[15px] text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-[260px] border-r border-[#ececec] bg-white overflow-y-auto shrink-0">
          <NavContent />
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-30 flex">
            <div 
              className="fixed inset-0 bg-black/20 backdrop-blur-sm" 
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <aside className="relative w-[280px] max-w-[80%] h-[calc(100vh-72px)] mt-[72px] bg-white border-r border-[#ececec] overflow-y-auto flex-1 shadow-xl">
              <NavContent />
            </aside>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto w-full max-w-[1200px] mx-auto px-4 sm:px-6 py-6 md:py-[40px]">
          {children}
        </main>
      </div>
    </>
  )
}
