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
    .select('id')
    .eq('user_id', user.id)
    .single()

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, species, base_price, is_active, booking_type, created_at')
    .eq('outfitter_id', outfitterProfile?.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">My listings</h1>
          <Link
            href="/outfitter/listings/new"
            className="bg-[#1B4332] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#163828] transition-colors"
          >
            + New listing
          </Link>
        </div>

        {listings && listings.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Title</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Species</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Price</th>
                  <th className="text-left px-5 py-3 font-medium text-gray-600">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {listings.map((l: any) => (
                  <tr key={l.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4 font-medium text-gray-900">{l.title}</td>
                    <td className="px-5 py-4 text-gray-500 capitalize">{l.species?.join(', ')}</td>
                    <td className="px-5 py-4 text-gray-700">${l.base_price?.toLocaleString()}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${l.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {l.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link href={`/outfitter/listings/${l.id}/edit`} className="text-[#1B4332] hover:underline">Edit</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-12 text-center">
            <p className="text-gray-400 text-sm mb-4">No listings yet</p>
            <Link href="/outfitter/listings/new" className="text-[#1B4332] font-medium hover:underline text-sm">
              Create your first listing
            </Link>
          </div>
        )}
      </main>
    </>
  )
}
