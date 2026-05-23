import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-blue-100 text-blue-700',
}

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

  const isScoutPro = profile?.scout_subscription_status === 'active'
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Hunter'

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10">

        {/* Header */}
        <div className="mb-10">
          <p className="text-xs font-bold uppercase tracking-widest text-[#1B4332] mb-1">Dashboard</p>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">
            Welcome back, {firstName}
          </h1>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-4 mb-10">
          <Link
            href="/listings"
            className="group bg-[#1B4332] text-white rounded-2xl p-6 hover:bg-[#163828] transition-colors relative overflow-hidden"
          >
            <div
              className="absolute inset-0 opacity-[0.05]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <div className="relative">
              <div className="text-3xl mb-3">🏕️</div>
              <div className="text-lg font-black tracking-tight">Browse Hunts</div>
              <div className="text-green-300 text-sm mt-1">Find your next guided hunt</div>
            </div>
          </Link>

          <Link
            href="/scout"
            className="group bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-[#1B4332] transition-colors"
          >
            <div className="text-3xl mb-3">🎯</div>
            <div className="text-lg font-black text-gray-900 tracking-tight">Scout AI</div>
            <div className="text-gray-500 text-sm mt-1">
              {isScoutPro
                ? <span className="text-[#1B4332] font-semibold">Pro — Active ✓</span>
                : 'Draw odds + AI strategy'}
            </div>
          </Link>
        </div>

        {/* Recent bookings */}
        <div>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-black text-gray-900 tracking-tight">Recent bookings</h2>
            <Link href="/dashboard/bookings" className="text-sm text-[#1B4332] font-semibold hover:underline">
              View all →
            </Link>
          </div>

          {bookings && bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.map((b: any) => (
                <div key={b.id} className="bg-white border border-gray-200 rounded-2xl px-5 py-4 flex items-center justify-between hover:border-gray-300 transition-colors">
                  <div>
                    <div className="font-semibold text-gray-900">{b.listings?.title}</div>
                    <div className="text-sm text-gray-400 mt-0.5">
                      {new Date(b.start_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} –{' '}
                      {new Date(b.end_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-gray-900">${b.total_price?.toLocaleString()}</span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[b.status] ?? 'bg-gray-100 text-gray-600'}`}>
                      {b.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl p-10 text-center">
              <div className="text-3xl mb-3">🦌</div>
              <p className="text-gray-500 text-sm mb-4">No bookings yet — your hunt awaits.</p>
              <Link href="/listings" className="inline-block bg-[#1B4332] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#163828] transition-colors">
                Browse Guided Hunts
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
