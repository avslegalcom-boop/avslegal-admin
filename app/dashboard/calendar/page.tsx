interface CalBooking {
  id: number
  uid: string
  title: string
  startTime: string
  endTime: string
  status: string
  attendees: { name: string; email: string }[]
}

interface CalResponse {
  bookings: CalBooking[]
}

async function getCalBookings(): Promise<CalBooking[]> {
  const apiKey = process.env.CAL_API_KEY
  if (!apiKey) return []

  try {
    const res = await fetch(`https://api.cal.com/v1/bookings?apiKey=${apiKey}`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return []
    const data: CalResponse = await res.json()
    return data.bookings ?? []
  } catch {
    return []
  }
}

function statusBadge(status: string) {
  const color =
    status === "ACCEPTED"
      ? "bg-green-100 text-green-700"
      : status === "PENDING"
        ? "bg-yellow-100 text-yellow-700"
        : status === "CANCELLED"
          ? "bg-red-100 text-red-600"
          : "bg-gray-100 text-gray-600"
  return (
    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {status}
    </span>
  )
}

export default async function CalendarPage() {
  const bookings = await getCalBookings()
  const now = new Date()

  const upcoming = bookings.filter((b) => new Date(b.startTime) >= now)
  const past = bookings.filter((b) => new Date(b.startTime) < now)

  if (!process.env.CAL_API_KEY) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#0A2540] mb-6">Calendar</h1>
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 text-center text-gray-400">
          Set <code className="bg-gray-100 px-1 rounded">CAL_API_KEY</code> in your .env.local to
          load Cal.com bookings.
        </div>
      </div>
    )
  }

  function BookingTable({ items, label }: { items: CalBooking[]; label: string }) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-[#0A2540]">
            {label}{" "}
            <span className="text-sm font-normal text-gray-400">({items.length})</span>
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                <th className="px-6 py-3 text-left font-medium">Title</th>
                <th className="px-6 py-3 text-left font-medium">Attendee</th>
                <th className="px-6 py-3 text-left font-medium">Start</th>
                <th className="px-6 py-3 text-left font-medium">End</th>
                <th className="px-6 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-400">
                    No {label.toLowerCase()}
                  </td>
                </tr>
              ) : (
                items.map((b) => (
                  <tr key={b.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3 font-medium text-gray-900">{b.title}</td>
                    <td className="px-6 py-3 text-gray-600">
                      {b.attendees?.[0]?.name ?? "—"}
                      <br />
                      <span className="text-xs text-gray-400">{b.attendees?.[0]?.email ?? ""}</span>
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {new Date(b.startTime).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-3 text-gray-600">
                      {new Date(b.endTime).toLocaleString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-3">{statusBadge(b.status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0A2540] mb-6">Calendar</h1>
      <BookingTable items={upcoming} label="Upcoming" />
      <BookingTable items={past} label="Past" />
    </div>
  )
}
