"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"

const links = [
  { href: "/dashboard", label: "Overview" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/calendar", label: "Calendar" },
  { href: "/dashboard/payments", label: "Payments" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-[#0A2540] text-white flex flex-col shrink-0">
      <div className="px-6 py-5 border-b border-white/10">
        <p className="text-lg font-bold tracking-wide">AVS Legal</p>
        <p className="text-xs text-slate-400 mt-0.5">Admin Panel</p>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
              pathname === href
                ? "bg-white/15 text-white font-medium"
                : "text-slate-300 hover:bg-white/8 hover:text-white"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-white/8 rounded-md text-left transition-colors"
        >
          Logout
        </button>
      </div>
    </aside>
  )
}
