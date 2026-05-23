import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import PayDepositButton from './PayDepositButton'

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
}

export default async function HunterBookings({ searchParams }: { searchParams: Promise<{ booked?: string; paid?: string }> }) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, status, start_date, end_date, party_size, total_price, deposit_paid, deposit_amount, booking_type, listing_id, listings(id, title, outfitter_profiles(business_name))')
    .eq('hunter_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-10">

        <div className="mb-8">
          <Link href="/dashboard" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors">
            ← Dashboard
          </Link>
        </div>

        <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-8">My bookings</h1>

        {params.booked === '1' && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
            <span className="text-lg">✓</span>
            Request sent! The outfitter will respond within 48 hours.
          </div>
        )}
        {params.paid === '1' && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm rounded-xl px-5 py-4 mb-6 flex items-center gap-3">
            <span className="text-lg">✓</span>
            Deposit paid — your spot is secured!
          </div>
        )}

        {bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((b: any) => (
              <div key={b.id} className="bg-white border border-gray-200 rounded-2xl p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-gray-900 text-base mb-0.5 truncate">{b.listings?.title}</div>
                    <div className="text-sm text-gray-500">{b.listings?.outfitter_profiles?.business_name}</div>
                    <div className="text-sm text-gray-400 mt-2">
                      {new Date(b.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                      {new Date(b.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      {' · '}{b.party_size} {b.party_size === 1 ? 'hunter' : 'hunters'}
                    </div>
                    {b.status === 'completed' && (
                      <Link
                        href={`/listings/${b.listing_id}/review?booking=${b.id}`}
                        className="mt-3 inline-block text-xs font-bold text-[#1B4332] hover:underline"
                      >
                        Leave a review →
                      </Link>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-black text-gray-900 text-lg mb-1">${b.total_price?.toLocaleString()}</div>
                    <span className={`inline-block text-xs font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {b.status}
                    </span>

                    {b.status === 'confirmed' && !b.deposit_paid && b.deposit_amount && (
                      <div className="mt-3">
                        <div className="text-xs font-semibold text-amber-600 mb-1.5">
                          ${b.deposit_amount.toLocaleString()} deposit due
                        </div>
                        <PayDepositButton bookingId={b.id} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl p-14 text-center">
            <div className="text-4xl mb-3">🦌</div>
            <p className="text-gray-400 text-sm mb-4">No bookings yet</p>
            <Link href="/listings" className="inline-block bg-[#1B4332] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#163828] transition-colors">
              Browse Guided Hunts
            </Link>
          </div>
        )}
      </main>
    </>
  )
}
