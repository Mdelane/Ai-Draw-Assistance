import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default async function OutfitterListings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: outfitterProfile } = await supabase
    .from('outfitter_profiles')
    .select('id, pilot_bookings_remaining, bookings_completed_count')
    .eq('user_id', user.id)
    .single()

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, species, base_price, is_active, booking_type, created_at, photos')
    .eq('outfitter_id', outfitterProfile?.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-10">
          <div>
            <Link href="/outfitter/dashboard" className="text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-colors block mb-2">
              ← Dashboard
            </Link>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">My listings</h1>
          </div>
          <Link
            href="/outfitter/listings/new"
            className="bg-[#1B4332] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#163828] transition-colors"
          >
            + New listing
          </Link>
        </div>

        {outfitterProfile && (outfitterProfile.pilot_bookings_remaining ?? 0) > 0 ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-5 py-4 mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-[#1B4332]">Founding Pilot</p>
            <p className="text-sm text-gray-700">You have {outfitterProfile.pilot_bookings_remaining} booking{outfitterProfile.pilot_bookings_remaining === 1 ? '' : 's'} remaining at 0% commission. After that, your rate moves to 7% permanently.</p>
          </div>
        ) : outfitterProfile && (outfitterProfile.pilot_bookings_remaining ?? 0) === 0 && (outfitterProfile.bookings_completed_count ?? 0) >= 3 ? (
          <p className="text-sm text-gray-500 mb-6">Pilot complete — your rate is now locked at 7% (founding outfitter).</p>
        ) : null}

        {listings && listings.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-stone-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wide">Listing</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wide">Species</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wide">Price</th>
                  <th className="text-left px-5 py-3.5 font-bold text-gray-500 text-xs uppercase tracking-wide">Status</th>
                  <th className="px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings.map((l: any) => (
                  <tr key={l.id} className="hover:bg-stone-50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {l.photos?.[0] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={l.photos[0]} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-stone-100 flex items-center justify-center shrink-0 text-stone-300">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        <span className="font-semibold text-gray-900">{l.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500 capitalize">{l.species?.join(', ')}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">${l.base_price?.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${l.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}>
                        {l.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/outfitter/listings/${l.id}/edit`} className="text-[#1B4332] font-semibold hover:underline text-xs">
                        Edit →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl p-14 text-center">
            <div className="text-4xl mb-3">🏕️</div>
            <p className="text-gray-400 text-sm mb-4">No listings yet</p>
            <Link href="/outfitter/listings/new" className="inline-block bg-[#1B4332] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#163828] transition-colors">
              Create your first listing
            </Link>
          </div>
        )}
      </main>
    </>
  )
}
