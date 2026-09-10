"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, MapPin, Users, Briefcase, FileText, Banknote, CalendarDays } from "lucide-react"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const links = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "USER"] },
    { href: "/branches", label: "Branches", icon: MapPin, roles: ["ADMIN"] },
    { href: "/centres", label: "Centres", icon: Users, roles: ["ADMIN", "USER"] },
    { href: "/members", label: "Members", icon: Users, roles: ["ADMIN", "USER"] },
    { href: "/loan-products", label: "Loan Products", icon: Briefcase, roles: ["ADMIN"] },
    { href: "/loans", label: "Loans", icon: Banknote, roles: ["ADMIN", "USER"] },
    { href: "/collection", label: "Collection", icon: CalendarDays, roles: ["ADMIN", "USER"] },
    { href: "/reports", label: "Reports", icon: FileText, roles: ["ADMIN", "USER"] },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      <div className="w-full md:w-64 bg-white border-r border-gray-200 shrink-0 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-blue-600">MicroCredit</h2>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          {links.map(link => {
            const isActive = pathname.startsWith(link.href) && (link.href !== "/dashboard" || pathname === "/dashboard")
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive ? "bg-blue-50 text-blue-700" : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <Icon className={`mr-3 h-5 w-5 ${isActive ? "text-blue-700" : "text-gray-400"}`} />
                {link.label}
              </Link>
            )
          })}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <form action="/api/auth/signout" method="POST">
            <button type="submit" className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md font-medium">
              Sign out
            </button>
          </form>
        </div>
      </div>
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 py-4 px-6 md:hidden">
          <h2 className="text-xl font-bold text-blue-600">MicroCredit</h2>
        </header>
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
