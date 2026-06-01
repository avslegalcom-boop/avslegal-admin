import { supabase } from "@/lib/supabase"
import BookingsTable from "@/components/BookingsTable"
import { Suspense } from "react"

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
}

interface SearchParams {
  plan?: string
  status?: string
  from?: string
  to?: string
}

async function getBookings(filters: SearchParams): Promise<{ bookings: Booking[]; total: number }> {
  let query = supabase
    .from("bookings")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })

  if (filters.plan) query = query.eq("plan", filters.plan)
  if (filters.status) query = query.eq("status", filters.status)
  if (filters.from) query = query.gte("created_at", `${filters.from}T00:00:00`)
  if (filters.to) query = query.lte("created_at", `${filters.to}T23:59:59`)

  const { data, count } = await query

  return {
    bookings: (data as Booking[]) ?? [],
    total: count ?? 0,
  }
}

export default async function BookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const filters = await searchParams
  const { bookings, total } = await getBookings(filters)

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0A2540] mb-6">Bookings</h1>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <Suspense>
          <BookingsTable bookings={bookings} total={total} />
        </Suspense>
      </div>
    </div>
  )
}
