import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default async function OutfitterDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'outfitter') redirect('/dashboard')

  const { data: outfitterProfile } = await supabase
    .from('outfitter_profiles')
    .select('id, business_name')
    .eq('user_id', user.id)
    .single()

  const { count: listingCount } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('outfitter_id', outfitterProfile?.id)

  const { count: pendingCount } = await supabase
    .from('bookings')
    .select('id', { count: 'exact', head: true })
    .eq('outfitter_id', outfitterProfile?.id)
    .eq('status', 'pending')

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {outfitterProfile?.business_name ?? profile?.full_name}
        </h1>
        <p className="text-gray-500 text-sm mb-8">Outfitter dashboard</p>

        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-3xl font-bold text-[#1B4332]">{listingCount ?? 0}</div>
            <div className="text-gray-500 text-sm mt-1">Active listings</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-3xl font-bold text-yellow-600">{pendingCount ?? 0}</div>
            <div className="text-gray-500 text-sm mt-1">Pending requests</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <div className="text-3xl font-bold text-gray-400">—</div>
            <div className="text-gray-500 text-sm mt-1">Revenue this month</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/outfitter/listings/new" className="bg-[#1B4332] text-white rounded-xl p-5 hover:bg-[#163828] transition-colors">
            <div className="text-lg font-semibold">+ New listing</div>
            <div className="text-green-200 text-sm mt-1">Add a hunt package</div>
          </Link>
          <Link href="/outfitter/bookings" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#1B4332] transition-colors">
            <div className="text-lg font-semibold text-gray-900">Booking requests</div>
            <div className="text-gray-500 text-sm mt-1">
              {pendingCount ? `${pendingCount} pending` : 'No pending requests'}
            </div>
          </Link>
        </div>
      </main>
    </>
  )
}
