"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { WalletCards, LogOut } from "lucide-react"
import { signOut } from "next-auth/react"

interface DashboardHeaderProps {
  isSuspended?: boolean
}

export function DashboardHeader({ isSuspended = false }: DashboardHeaderProps) {
  const pathname = usePathname()

  const categories = [
    {
      name: "Core",
      links: [
        { href: "/dashboard", label: "Overview" },
        { href: "/reports", label: "Reports" },
      ],
    },
    {
      name: "Portfolio",
      links: [
        { href: "/loans", label: "Loans" },
        { href: "/loan-products", label: "Products" },
      ],
    },
    {
      name: "Operations",
      links: [
        { href: "/members", label: "Members" },
        { href: "/collection", label: "Collection" },
        { href: "/centres", label: "Centres" },
        { href: "/branches", label: "Branches" },
      ],
    },
  ]

  // Flatten links to find active category
  const activeCategory =
    categories.find((c) =>
      c.links.some(
        (l) =>
          pathname.startsWith(l.href) &&
          (l.href !== "/dashboard" || pathname === "/dashboard")
      )
    ) || categories[0]

  return (
    <>
      {/* Top Navigation - Transparent, Whisper Quiet */}
      <header className="w-full max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo - Left */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-ink-black text-paper-white">
            <WalletCards className="h-4 w-4" />
          </div>
          <span className="font-serif text-xl tracking-tight font-medium">
            Steep MicroFinance
          </span>
        </Link>

        {/* Categories - Center */}
        {!isSuspended && (
          <nav className="hidden md:flex items-center gap-8">
            {categories.map((cat) => {
              const isActive = activeCategory.name === cat.name
              return (
                <Link
                  key={cat.name}
                  href={cat.links[0].href}
                  className={`text-[16px] transition-colors ${
                    isActive
                      ? "text-ink-black font-medium"
                      : "text-slate-gray hover:text-ink-black"
                  }`}
                >
                  {cat.name}
                </Link>
              )
            })}
          </nav>
        )}

        {/* CTAs - Right */}
        <div className="flex items-center gap-6">
          <Link
            href="/settings/billing"
            className={`text-[15px] transition-colors ${
              pathname.startsWith("/settings")
                ? "text-ink-black font-medium"
                : "text-slate-gray hover:text-ink-black"
            }`}
          >
            Settings
          </Link>
          <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center gap-2 text-[15px] text-slate-gray hover:text-ink-black transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign out</span>
            </button>
        </div>
      </header>

      {/* Sub-Navigation Band */}
      {!isSuspended && (
        <div className="w-full bg-fog-white border-b border-border/40">
          <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center gap-6">
            {activeCategory.links.map((link) => {
              const isActive =
                pathname.startsWith(link.href) &&
                (link.href !== "/dashboard" || pathname === "/dashboard")
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-[14px] px-3 py-1.5 rounded-full transition-all ${
                    isActive
                      ? "bg-ink-black text-paper-white font-medium"
                      : "text-slate-gray hover:text-ink-black hover:bg-mist-gray"
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </>
  )
}
