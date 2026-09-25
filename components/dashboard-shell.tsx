"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Menu, X, LogOut, LayoutDashboard, FileText, 
  Users, DollarSign, Settings, Building, MapPin, 
  Grid, Briefcase, ChevronDown, User as UserIcon,
  RotateCcw, Bell, Database, ShieldCheck
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
  const role = user?.role
  const isSystemAdmin = role === "SYSTEM_ADMIN" || role === "ADMIN"
  const isHeadOffice = role === "HEAD_OFFICE"
  const isAccountant = role === "ACCOUNTANT"
  const isBranchManager = role === "BRANCH_MANAGER"
  const isFieldOfficer = role === "FIELD_OFFICER" || role === "USER"

  const canViewFinance = isSystemAdmin || isHeadOffice || isAccountant || isBranchManager
  const canViewSettings = isSystemAdmin || isHeadOffice
  
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
        { href: "/app/dashboard", label: "Overview", icon: LayoutDashboard },
        { href: "/app/reports", label: "Reports", icon: FileText },
      ],
    },
    {
      name: "Operations",
      items: [
        { href: "/app/members", label: "Members", icon: Users },
        { href: "/app/groups", label: "Groups", icon: Users },
        { href: "/app/loans", label: "Loans", icon: DollarSign },
        { href: "/app/collection", label: "Collection", icon: Briefcase },
        ...(!isFieldOfficer ? [{ href: "/app/documents", label: "Document Verification", icon: FileText }] : []),
        ...(canViewFinance ? [{ href: "/app/risk", label: "Risk", icon: Bell }] : []),
      ],
    },
    ...(canViewFinance ? [
      {
        name: "Finance",
        items: [
          ...(isSystemAdmin || isHeadOffice || isAccountant ? [{ href: "/app/accounting", label: "Accounting", icon: FileText }] : []),
          { href: "/app/cashflow", label: "Cash Flow", icon: DollarSign },
          { href: "/app/loans/reversals", label: "Reversals", icon: RotateCcw },
        ],
      }
    ] : []),
    ...(canViewSettings ? [
      {
        name: "Settings",
        items: [
          { href: "/app/branches", label: "Branches", icon: Building },
          { href: "/app/centres", label: "Centres", icon: MapPin },
          { href: "/app/loan-products", label: "Loan Products", icon: Grid },
          { href: "/app/savings-products", label: "Savings Products", icon: DollarSign },
          { href: "/app/settings/team", label: "Team", icon: Users },
          { href: "/app/settings/billing", label: "Billing", icon: Settings },
          { href: "/app/settings/audit-log", label: "Audit Log", icon: FileText },
          { href: "/app/settings/notifications", label: "Notifications", icon: Bell },
          ...(isSystemAdmin || isHeadOffice ? [
            { href: "/app/settings/migrations", label: "Data Migrations", icon: Database },
            { href: "/app/settings/approvals", label: "Approval Workflow", icon: ShieldCheck }
          ] : []),
        ],
      }
    ] : [])
  ]

  const NavContent = () => (
    <div className="flex flex-col gap-6 py-6 px-4">
      {navGroups.map((group) => (
        <div key={group.name} className="flex flex-col gap-2">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3">
            {group.name}
          </h3>
          <div className="flex flex-col gap-1">
            {group.items.map((item) => {
              const isActive = pathname.startsWith(item.href) && (item.href !== "/app/dashboard" || pathname === "/app/dashboard")
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-[15px] font-medium transition-colors",
                    isActive 
                      ? "bg-brand-600 text-white" 
                      : "text-slate-300 hover:bg-white/10 hover:text-white"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-white" : "text-slate-400")} />
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
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 sm:px-6 h-[72px] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 -ml-2 text-slate-700 hover:bg-slate-50 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <Link href="/app/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-50 rounded-lg flex items-center justify-center border border-brand-100">
              <div className="w-5 h-5 border-2 border-brand-600 rounded-sm transform rotate-45" />
            </div>
            <span className="text-[20px] font-semibold tracking-tight hidden sm:block text-navy-950">
              {orgName}
            </span>
          </Link>
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-full pr-4 transition-colors border border-transparent hover:border-slate-200"
          >
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-200">
              <UserIcon className="w-5 h-5 text-slate-500" />
            </div>
            <div className="hidden sm:flex flex-col items-start">
              <span className="text-[14px] font-medium leading-none text-navy-900">{user?.name || "User"}</span>
              <span className="text-[12px] text-slate-500 mt-1 leading-none">{user?.role === "ADMIN" ? "Admin" : "Officer"}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-2 z-50">
              <div className="px-4 py-3 border-b border-slate-100 sm:hidden">
                <p className="text-sm font-medium text-navy-900 truncate">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/app/login" })}
                className="w-full text-left px-4 py-2.5 text-[15px] text-danger-600 hover:bg-danger-50 flex items-center gap-2 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex flex-1 overflow-hidden bg-slate-50">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-[260px] bg-navy-950 overflow-y-auto shrink-0 shadow-[inset_-1px_0_0_rgba(255,255,255,0.1)]">
          <NavContent />
        </aside>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-30 flex">
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" 
              onClick={() => setIsMobileMenuOpen(false)}
            />
            <aside className="relative w-[280px] max-w-[80%] h-[calc(100vh-72px)] mt-[72px] bg-navy-950 overflow-y-auto flex-1 shadow-xl">
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
