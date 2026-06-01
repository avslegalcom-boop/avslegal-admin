import { supabase } from "@/lib/supabase"

function paiseToRupees(paise: number) { return paise / 100 }
function fmtRupees(paise: number) {
  return `₹${paiseToRupees(paise).toLocaleString("en-IN")}`
}

interface Booking {
  id: string
  name: string
  email: string
  phone: string
  consultation_type: string | null
  plan: string | null
  amount: number
  payment_id: string | null
  payment_status: string | null
  status: string | null
  booking_status: string | null
  selected_date: string | null
  selected_time: string | null
  created_at: string
}

async function getStats() {
  const now       = new Date()
  const todayISO  = now.toISOString().split("T")[0]
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [
    { count: total },
    { data: revenue },
    { count: thisMonth },
    { count: todayCount },
    { count: upcoming },
  ] = await Promise.all([
    supabase.from("bookings").select("*", { count: "exact", head: true }),
    supabase.from("bookings").select("amount")
      .or("payment_status.eq.paid,status.eq.paid"),
    supabase.from("bookings").select("*", { count: "exact", head: true })
      .gte("created_at", monthStart),
    supabase.from("bookings").select("*", { count: "exact", head: true })
      .eq("selected_date", todayISO),
    supabase.from("bookings").select("*", { count: "exact", head: true })
      .or("booking_status.eq.confirmed,status.eq.paid")
      .gte("selected_date", todayISO),
  ])

  const totalRevenue = (revenue ?? []).reduce((sum, b) => sum + (b.amount ?? 0), 0)

  return {
    total:        total        ?? 0,
    totalRevenue,
    thisMonth:    thisMonth    ?? 0,
    todayCount:   todayCount   ?? 0,
    upcoming:     upcoming     ?? 0,
  }
}

async function getRecentBookings(): Promise<Booking[]> {
  const { data } = await supabase
    .from("bookings")
    .select("id, name, email, phone, consultation_type, plan, amount, payment_status, status, booking_status, selected_date, selected_time, payment_id, created_at")
    .order("created_at", { ascending: false })
    .limit(5)
  return (data as Booking[]) ?? []
}

function StatCard({ label, value, sub, accent }: {
  label: string; value: string; sub?: string; accent?: boolean
}) {
  return (
    <div className={`rounded-xl border p-5 shadow-sm ${accent ? "bg-[#0A2540] border-[#0A2540]" : "bg-white border-gray-200"}`}>
      <p className={`text-sm font-medium ${accent ? "text-blue-300" : "text-gray-500"}`}>{label}</p>
      <p className={`text-2xl font-bold mt-1 ${accent ? "text-white" : "text-[#0A2540]"}`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? "text-blue-400/70" : "text-gray-400"}`}>{sub}</p>}
    </div>
  )
}

function paymentBadge(status: string | null) {
  const s = status ?? "pending"
  const color = s === "paid" ? "bg-green-100 text-green-700"
    : s === "failed"         ? "bg-red-100 text-red-700"
    : "bg-yellow-100 text-yellow-700"
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {s}
    </span>
  )
}

function bookingBadge(status: string | null) {
  const s = status ?? "pending"
  const color = s === "confirmed" ? "bg-blue-100 text-blue-700"
    : s === "cancelled"           ? "bg-gray-100 text-gray-500"
    : "bg-yellow-50 text-yellow-700"
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {s}
    </span>
  )
}

export default async function DashboardPage() {
  const [stats, recentBookings] = await Promise.all([getStats(), getRecentBookings()])

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0A2540] mb-6">Overview</h1>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Revenue"    value={fmtRupees(stats.totalRevenue)} sub="All paid bookings" accent />
        <StatCard label="Total Bookings"   value={stats.total.toString()}         sub="All time" />
        <StatCard label="This Month"       value={stats.thisMonth.toString()}      sub="Current month" />
        <StatCard label="Today's Bookings" value={stats.todayCount.toString()}     sub="Scheduled today" />
        <StatCard label="Upcoming"         value={stats.upcoming.toString()}       sub="Confirmed future" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#0A2540]">Recent Bookings</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Email</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Amount</th>
                <th className="px-4 py-3 text-left font-medium">Payment</th>
                <th className="px-4 py-3 text-left font-medium">Booking</th>
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-400">
                    No bookings yet
                  </td>
                </tr>
              ) : (
                recentBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900">{b.name || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{b.email || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize text-xs">
                      {b.consultation_type || b.plan || "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {fmtRupees(b.amount ?? 0)}
                    </td>
                    <td className="px-4 py-3">
                      {paymentBadge(b.payment_status || b.status)}
                    </td>
                    <td className="px-4 py-3">
                      {bookingBadge(b.booking_status)}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {b.selected_date
                        ? new Date(b.selected_date).toLocaleDateString("en-IN", {
                            day: "numeric", month: "short", year: "numeric",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {b.selected_time || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
