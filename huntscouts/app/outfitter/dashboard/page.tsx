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

  const [{ count: listingCount }, { count: pendingCount }, { count: confirmedCount }] = await Promise.all([
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('outfitter_id', outfitterProfile?.id).eq('is_active', true),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('outfitter_id', outfitterProfile?.id).eq('status', 'pending'),
    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('outfitter_id', outfitterProfile?.id).eq('status', 'confirmed'),
  ])

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[#1B4332] mb-1">Outfitter Dashboard</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            {outfitterProfile?.business_name ?? profile?.full_name}
          </h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Active Listings</div>
            <div className="text-4xl font-black text-[#1B4332]">{listingCount ?? 0}</div>
          </div>
          <div className={`rounded-2xl p-6 ${(pendingCount ?? 0) > 0 ? 'bg-amber-50 border border-amber-200' : 'bg-white border border-gray-200'}`}>
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Pending Requests</div>
            <div className={`text-4xl font-black ${(pendingCount ?? 0) > 0 ? 'text-amber-600' : 'text-gray-300'}`}>
              {pendingCount ?? 0}
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">Confirmed</div>
            <div className="text-4xl font-black text-gray-900">{confirmedCount ?? 0}</div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <Link
            href="/outfitter/listings/new"
            className="bg-[#1B4332] text-white rounded-2xl p-6 hover:bg-[#163828] transition-colors relative overflow-hidden group"
          >
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <div className="relative">
              <div className="text-3xl mb-3">+</div>
              <div className="text-lg font-black tracking-tight">New Listing</div>
              <div className="text-green-300 text-sm mt-1">Add a hunt package</div>
            </div>
          </Link>

          <Link
            href="/outfitter/bookings"
            className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-[#1B4332] transition-colors"
          >
            <div className="text-3xl mb-3">📋</div>
            <div className="text-lg font-black text-gray-900 tracking-tight">Booking Requests</div>
            <div className="text-sm mt-1">
              {(pendingCount ?? 0) > 0
                ? <span className="text-amber-600 font-semibold">{pendingCount} pending — action needed</span>
                : <span className="text-gray-400">No pending requests</span>}
            </div>
          </Link>
        </div>

        {/* Secondary links */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { href: '/outfitter/listings', label: 'Manage Listings' },
            { href: '/outfitter/profile', label: 'Edit Profile' },
            { href: '/listings', label: 'View Marketplace' },
          ].map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 text-center hover:border-[#1B4332] hover:text-[#1B4332] transition-colors"
            >
              {label}
            </Link>
          ))}
        </div>
      </main>
    </>
  )
}
