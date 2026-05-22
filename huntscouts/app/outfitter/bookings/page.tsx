import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import BookingActions from './BookingActions'
import CompleteButton from './CompleteButton'

export default async function OutfitterBookings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: outfitterProfile } = await supabase
    .from('outfitter_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, status, start_date, end_date, party_size, total_price, booking_type, message_to_outfitter, listings(title), users!hunter_id(full_name, email)')
    .eq('outfitter_id', outfitterProfile?.id)
    .order('created_at', { ascending: false })

  const pending = bookings?.filter((b: any) => b.status === 'pending') ?? []
  const others = bookings?.filter((b: any) => b.status !== 'pending') ?? []

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Booking requests</h1>

        {pending.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-yellow-700 uppercase tracking-wide mb-3">Pending ({pending.length})</h2>
            <div className="space-y-4">
              {pending.map((b: any) => (
                <div key={b.id} className="bg-white border border-yellow-200 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="font-semibold text-gray-900">{b.listings?.title}</div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        {b.users?.full_name} · {b.start_date} – {b.end_date} · Party of {b.party_size}
                      </div>
                      {b.message_to_outfitter && (
                        <div className="text-sm text-gray-600 mt-2 italic">"{b.message_to_outfitter}"</div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-semibold text-gray-900">${b.total_price?.toLocaleString()}</div>
                      <BookingActions bookingId={b.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {others.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">All bookings</h2>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Hunt</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Hunter</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Dates</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {others.map((b: any) => (
                    <tr key={b.id}>
                      <td className="px-5 py-3 text-gray-900">{b.listings?.title}</td>
                      <td className="px-5 py-3 text-gray-500">{b.users?.full_name}</td>
                      <td className="px-5 py-3 text-gray-500">{b.start_date} – {b.end_date}</td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                            b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            b.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                            b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {b.status}
                          </span>
                          {b.status === 'confirmed' && (
                            <CompleteButton bookingId={b.id} />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {!bookings?.length && (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400 text-sm">
            No booking requests yet
          </div>
        )}
      </main>
    </>
  )
}
