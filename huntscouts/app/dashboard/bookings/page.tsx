import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import PayDepositButton from './PayDepositButton'

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
          <Link href="/dashboard" className="text-gray-400 hover:text-gray-600 text-sm">← Dashboard</Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My bookings</h1>

        {params.booked === '1' && (
          <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3 mb-6">
            Request sent! The outfitter will respond within 48 hours.
          </div>
        )}
        {params.paid === '1' && (
          <div className="bg-green-50 text-green-700 text-sm rounded-lg px-4 py-3 mb-6">
            Deposit paid — your spot is secured!
          </div>
        )}

        {bookings && bookings.length > 0 ? (
          <div className="space-y-4">
            {bookings.map((b: any) => (
              <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{b.listings?.title}</div>
                    <div className="text-sm text-gray-500 mt-0.5">{b.listings?.outfitter_profiles?.business_name}</div>
                    <div className="text-sm text-gray-500 mt-1">{b.start_date} – {b.end_date} · Party of {b.party_size}</div>
                    {b.status === 'completed' && (
                      <Link
                        href={`/listings/${b.listing_id}/review?booking=${b.id}`}
                        className="mt-2 inline-block text-xs text-[#1B4332] font-medium hover:underline"
                      >
                        Leave a review →
                      </Link>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-semibold text-gray-900">${b.total_price?.toLocaleString()}</div>
                    <span className={`mt-1 inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
                      b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      b.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {b.status}
                    </span>
                    {b.status === 'confirmed' && !b.deposit_paid && b.deposit_amount && (
                      <div>
                        <div className="text-xs text-orange-600 mt-1">
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
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-sm mb-3">No bookings yet</p>
            <Link href="/listings" className="text-[#1B4332] font-medium text-sm hover:underline">Browse hunts</Link>
          </div>
        )}
      </main>
    </>
  )
}
