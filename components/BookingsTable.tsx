"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

interface Booking {
  id: string
  name: string
  email: string
  phone: string
  plan: string
  amount: number
  payment_id: string
  status: string
  query: string
  created_at: string
  meeting_url?: string
  cal_booking_uid?: string
  date?: string
  time?: string
}

interface Props {
  bookings: Booking[]
  total: number
}

const STATUS_OPTIONS = ["", "paid", "pending", "failed"]
const PLAN_OPTIONS = [
  "",
  "Legal Doubt Clearance",
  "Quick Legal Consultation",
  "Detailed Case Analysis",
]

function statusBadge(status: string) {
  const color =
    status === "paid"
      ? "bg-green-100 text-green-700"
      : status === "pending"
        ? "bg-yellow-100 text-yellow-700"
        : "bg-red-100 text-red-600"
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status}
    </span>
  )
}

function exportCSV(bookings: Booking[]) {
  const headers = [
    "Name", "Email", "Phone", "Plan", "Amount (paise)", "Amount (₹)",
    "Payment ID", "Status", "Appointment Date", "Appointment Time",
    "Cal Booking UID", "Meeting URL", "Query", "Booked On",
  ]
  const rows = bookings.map((b) => [
    b.name ?? "",
    b.email ?? "",
    b.phone ?? "",
    b.plan ?? "",
    b.amount?.toString() ?? "0",
    b.amount ? `₹${(b.amount / 100).toLocaleString("en-IN")}` : "0",
    b.payment_id ?? "",
    b.status ?? "",
    b.date ?? "",
    b.time ?? "",
    b.cal_booking_uid ?? "",
    b.meeting_url ?? "",
    (b.query ?? "").replace(/,/g, ";"),
    new Date(b.created_at).toLocaleDateString("en-IN"),
  ])

  const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n")
  const blob = new Blob([csv], { type: "text/csv" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export default function BookingsTable({ bookings, total }: Props) {
  const router = useRouter()
  const params = useSearchParams()

  const plan = params.get("plan") ?? ""
  const status = params.get("status") ?? ""
  const from = params.get("from") ?? ""
  const to = params.get("to") ?? ""

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString())
      if (value) next.set(key, value)
      else next.delete(key)
      router.push(`/dashboard/bookings?${next.toString()}`)
    },
    [params, router]
  )

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Plan</label>
          <select
            value={plan}
            onChange={(e) => setParam("plan", e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20"
          >
            <option value="">All plans</option>
            {PLAN_OPTIONS.filter(Boolean).map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setParam("status", e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setParam("from", e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setParam("to", e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#0A2540]/20"
          />
        </div>

        <div className="ml-auto">
          <button
            onClick={() => exportCSV(bookings)}
            className="px-4 py-1.5 bg-[#0A2540] text-white text-sm rounded-lg hover:bg-[#0A2540]/90 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="text-xs text-gray-400 mb-3">
        Showing {bookings.length} of {total} bookings
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
              <th className="px-4 py-3 text-left font-medium">Name</th>
              <th className="px-4 py-3 text-left font-medium">Email</th>
              <th className="px-4 py-3 text-left font-medium">Phone</th>
              <th className="px-4 py-3 text-left font-medium">Plan</th>
              <th className="px-4 py-3 text-left font-medium">Amount</th>
              <th className="px-4 py-3 text-left font-medium">Appointment</th>
              <th className="px-4 py-3 text-left font-medium">Meeting</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Booked On</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                  No bookings match your filters
                </td>
              </tr>
            ) : (
              bookings.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{b.name || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{b.email || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{b.phone || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-[140px]">
                    <span className="block truncate" title={b.plan}>{b.plan || "—"}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-900 whitespace-nowrap font-medium">
                    ₹{((b.amount ?? 0) / 100).toLocaleString("en-IN")}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {b.date ? (
                      <span>
                        {new Date(b.date).toLocaleDateString("en-IN", {
                          day: "numeric", month: "short", year: "numeric",
                        })}
                        {b.time && <span className="text-gray-400 ml-1 text-xs">@ {b.time}</span>}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {b.meeting_url ? (
                      <a
                        href={b.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#0A2540] hover:text-blue-600 font-medium text-xs underline underline-offset-2 transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M15 10l4.553-2.069A1 1 0 0121 8.882v6.235a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z"/>
                        </svg>
                        Join Meeting
                      </a>
                    ) : (
                      <span className="text-gray-300 text-xs">No link</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{statusBadge(b.status)}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {new Date(b.created_at).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
