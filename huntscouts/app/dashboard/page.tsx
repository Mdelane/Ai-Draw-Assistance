import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default async function HunterDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('users')
    .select('full_name, role, scout_subscription_status')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'outfitter') redirect('/outfitter/dashboard')

  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, status, start_date, end_date, total_price, listings(title)')
    .eq('hunter_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          Welcome back, {profile?.full_name?.split(' ')[0] ?? 'Hunter'}
        </h1>
        <p className="text-gray-500 text-sm mb-8">Manage your bookings and Scout strategy</p>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <Link href="/listings" className="bg-[#1B4332] text-white rounded-xl p-5 hover:bg-[#163828] transition-colors">
            <div className="text-lg font-semibold">Browse Hunts</div>
            <div className="text-green-200 text-sm mt-1">Find your next guided hunt</div>
          </Link>
          <Link href="/scout" className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#1B4332] transition-colors">
            <div className="text-lg font-semibold text-gray-900">Scout AI</div>
            <div className="text-gray-500 text-sm mt-1">
              {profile?.scout_subscription_status === 'active' ? 'Active subscription' : 'Draw odds + AI strategy'}
            </div>
          </Link>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent bookings</h2>
            <Link href="/dashboard/bookings" className="text-sm text-[#1B4332] hover:underline">View all</Link>
          </div>

          {bookings && bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.map((b: any) => (
                <div key={b.id} className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900">{b.listings?.title}</div>
                    <div className="text-sm text-gray-500">{b.start_date} – {b.end_date}</div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    b.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                    b.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    b.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {b.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-8 text-center text-gray-400 text-sm">
              No bookings yet.{' '}
              <Link href="/listings" className="text-[#1B4332] hover:underline">Browse available hunts</Link>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
