import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/')

  const [
    { count: userCount },
    { count: listingCount },
    { count: bookingCount },
    { count: pendingVerifications },
  ] = await Promise.all([
    supabase.from('users').select('id', { count: 'exact', head: true }),
    supabase.from('listings').select('id', { count: 'exact', head: true }),
    supabase.from('bookings').select('id', { count: 'exact', head: true }),
    supabase.from('outfitter_profiles').select('id', { count: 'exact', head: true }).eq('license_verified', false),
  ])

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin</h1>

        <div className="grid grid-cols-4 gap-4 mb-10">
          {[
            ['Users', userCount ?? 0, 'gray'],
            ['Listings', listingCount ?? 0, 'green'],
            ['Bookings', bookingCount ?? 0, 'blue'],
            ['Unverified outfitters', pendingVerifications ?? 0, 'yellow'],
          ].map(([label, count, color]) => (
            <div key={label as string} className="bg-white border border-gray-200 rounded-xl p-5">
              <div className="text-3xl font-bold text-gray-900">{count as number}</div>
              <div className="text-gray-500 text-sm mt-1">{label as string}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Link href="/admin/users" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#1B4332] transition-colors">
            <div className="font-semibold text-gray-900">Manage users</div>
            <div className="text-gray-500 text-sm mt-1">View all accounts, change roles</div>
          </Link>
          <Link href="/admin/listings" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#1B4332] transition-colors">
            <div className="font-semibold text-gray-900">Verify outfitters</div>
            <div className="text-gray-500 text-sm mt-1">Review licenses, verify profiles</div>
          </Link>
        </div>
      </main>
    </>
  )
}
