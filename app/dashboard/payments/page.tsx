import { supabase } from "@/lib/supabase"

interface PlanStats {
  plan: string
  count: number
  revenue: number
  unitPrice: number
}

// amounts in DB are stored in paise (Razorpay format: ₹300 = 30000 paise)
const PLAN_PRICES_PAISE: Record<string, number> = {
  "legal doubt clearance": 30000,
  "quick legal consultation": 50000,
  "detailed case analysis": 200000,
  "detailed legal consultation": 200000,
}

function fmtRupees(paise: number) {
  return `₹${(paise / 100).toLocaleString("en-IN")}`
}

async function getPaymentStats() {
  const { data } = await supabase
    .from("bookings")
    .select("plan, amount, status")
    .eq("status", "paid")

  const rows = data ?? []

  const totalRevenue = rows.reduce((sum, r) => sum + (r.amount ?? 0), 0)
  const totalCount = rows.length

  const byPlan: Record<string, { count: number; revenue: number }> = {}
  for (const row of rows) {
    const key = (row.plan ?? "unknown").toLowerCase()
    if (!byPlan[key]) byPlan[key] = { count: 0, revenue: 0 }
    byPlan[key].count += 1
    byPlan[key].revenue += row.amount ?? 0
  }

  const planStats: PlanStats[] = Object.entries(byPlan).map(([plan, v]) => ({
    plan,
    count: v.count,
    revenue: v.revenue,
    unitPrice: PLAN_PRICES_PAISE[plan] ?? 0,
  }))

  planStats.sort((a, b) => b.revenue - a.revenue)

  return { totalRevenue, totalCount, planStats }
}

function RevenueCard({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <p className="text-sm text-gray-500 font-medium">{label}</p>
      <p className="text-3xl font-bold text-[#0A2540] mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  )
}

const PLAN_COLORS: Record<string, string> = {
  basic: "bg-blue-100 text-blue-700",
  standard: "bg-indigo-100 text-indigo-700",
  premium: "bg-purple-100 text-purple-700",
}

export default async function PaymentsPage() {
  const { totalRevenue, totalCount, planStats } = await getPaymentStats()

  const avgRevenue = totalCount > 0 ? Math.round(totalRevenue / totalCount) : 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0A2540] mb-6">Payments</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <RevenueCard
          label="Total Revenue"
          value={fmtRupees(totalRevenue)}
          sub="All paid bookings"
        />
        <RevenueCard
          label="Total Paid Bookings"
          value={totalCount.toString()}
          sub="Completed payments"
        />
        <RevenueCard
          label="Avg. Revenue / Booking"
          value={fmtRupees(avgRevenue)}
          sub="Mean booking value"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#0A2540]">Revenue by Plan</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-6 py-3 text-left font-medium">Plan</th>
                <th className="px-6 py-3 text-left font-medium">Unit Price</th>
                <th className="px-6 py-3 text-left font-medium">Bookings</th>
                <th className="px-6 py-3 text-left font-medium">Revenue</th>
                <th className="px-6 py-3 text-left font-medium">Share</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {planStats.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No paid bookings yet
                  </td>
                </tr>
              ) : (
                planStats.map((p) => {
                  const share = totalRevenue > 0 ? ((p.revenue / totalRevenue) * 100).toFixed(1) : "0"
                  const colorClass = PLAN_COLORS[p.plan] ?? "bg-gray-100 text-gray-600"
                  return (
                    <tr key={p.plan} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${colorClass}`}
                        >
                          {p.plan}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-600">
                        {p.unitPrice > 0 ? fmtRupees(p.unitPrice) : "—"}
                      </td>
                      <td className="px-6 py-3 text-gray-900 font-medium">{p.count}</td>
                      <td className="px-6 py-3 text-gray-900 font-semibold">
                        {fmtRupees(p.revenue)}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 bg-gray-200 rounded-full w-24 overflow-hidden">
                            <div
                              className="h-2 bg-[#0A2540] rounded-full"
                              style={{ width: `${share}%` }}
                            />
                          </div>
                          <span className="text-gray-500 text-xs">{share}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
