import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import BookingActions from './BookingActions'
import CompleteButton from './CompleteButton'

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
}

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

        <div className="mb-8">
          <Link href="/outfitter/dashboard" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">
            ← Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-10">Booking requests</h1>

        {/* Pending — needs action */}
        {pending.length > 0 && (
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-amber-600">Action needed</h2>
              <span className="bg-amber-400 text-amber-900 text-xs font-black px-2 py-0.5 rounded-full">{pending.length}</span>
            </div>
            <div className="space-y-4">
              {pending.map((b: any) => (
                <div key={b.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-900 text-base mb-1 truncate">{b.listings?.title}</div>
                      <div className="text-sm text-gray-600">
                        {b.users?.full_name} · {' '}
                        {new Date(b.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                        {new Date(b.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}Party of {b.party_size}
                      </div>
                      {b.message_to_outfitter && (
                        <div className="text-sm text-gray-500 mt-3 bg-white/60 rounded-xl px-4 py-3 italic border border-amber-100">
                          &ldquo;{b.message_to_outfitter}&rdquo;
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-gray-900 text-lg mb-3">${b.total_price?.toLocaleString()}</div>
                      <BookingActions bookingId={b.id} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* All other bookings */}
        {others.length > 0 && (
          <section>
            <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">All bookings</h2>
            <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-stone-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wide">Hunt</th>
                    <th className="text-left px-5 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wide">Hunter</th>
                    <th className="text-left px-5 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wide">Dates</th>
                    <th className="text-left px-5 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {others.map((b: any) => (
                    <tr key={b.id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-5 py-4 font-semibold text-gray-900">{b.listings?.title}</td>
                      <td className="px-5 py-4 text-gray-500">{b.users?.full_name}</td>
                      <td className="px-5 py-4 text-gray-400 text-xs">
                        {new Date(b.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                        {new Date(b.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {b.status}
                          </span>
                          {b.status === 'confirmed' && <CompleteButton bookingId={b.id} />}
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
          <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl p-14 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-gray-400 text-sm">No booking requests yet</p>
          </div>
        )}
      </main>
    </>
  )
}
