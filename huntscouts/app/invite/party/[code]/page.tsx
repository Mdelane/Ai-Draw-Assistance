import { redirect } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import JoinPartyButton from './JoinPartyButton'

export default async function PartyInvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const supabase = await createClient()
  const adminSupabase = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: room } = await adminSupabase
    .from('party_hunt_rooms')
    .select('id, state, species, weapon_type, target_year, status, owner_user_id, users!owner_user_id(full_name)')
    .eq('invite_code', code)
    .single()

  if (!room) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
          <div className="max-w-md text-center">
            <p className="text-4xl mb-4">🔍</p>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-2">Invalid invite link</h1>
            <p className="text-gray-500 text-sm mb-6">This invite link is invalid or expired.</p>
            <Link href="/" className="text-[#1B4332] font-semibold text-sm underline">Back to HuntScouts</Link>
          </div>
        </main>
      </>
    )
  }

  const { count: memberCount } = await adminSupabase
    .from('party_hunt_members')
    .select('id', { count: 'exact', head: true })
    .eq('room_id', room.id)

  if (user) {
    const { data: existing } = await adminSupabase
      .from('party_hunt_members')
      .select('id')
      .eq('room_id', room.id)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      redirect(`/party/${room.id}`)
    }
  }

  let userName: string | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', user.id)
      .single()
    userName = profile?.full_name ?? null
  }

  const roomAny = room as any
  const ownerName: string = roomAny.users?.full_name ?? 'A hunter'

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-md">
          <p className="text-xs font-bold uppercase tracking-widest text-[#1B4332] mb-2">Party Hunt Invite</p>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-2">
            You&apos;re invited to hunt together
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            {ownerName} is building a party hunt room and wants to find a unit everyone can draw.
          </p>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">State</p>
                <p className="font-semibold text-gray-900">{room.state}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Species</p>
                <p className="font-semibold text-gray-900 capitalize">{room.species}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Weapon</p>
                <p className="font-semibold text-gray-900 capitalize">{room.weapon_type}</p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Year</p>
                <p className="font-semibold text-gray-900">{room.target_year}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                <span className="font-semibold text-gray-700">{memberCount ?? 0}</span> {(memberCount ?? 0) === 1 ? 'member' : 'members'} in this room
              </p>
            </div>
          </div>

          {room.status !== 'open' && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3 mb-5">
              This room is no longer accepting new members.
            </div>
          )}

          {user ? (
            <JoinPartyButton
              roomId={room.id}
              userName={userName ?? 'you'}
              disabled={room.status !== 'open'}
            />
          ) : (
            <div className="space-y-3">
              <Link
                href={`/signup?next=/invite/party/${code}`}
                className="block w-full bg-amber-400 text-black font-black text-center py-3.5 rounded-xl hover:bg-amber-300 transition-colors"
              >
                Create a free account to join
              </Link>
              <Link
                href={`/login?next=/invite/party/${code}`}
                className="block w-full bg-white border border-gray-200 text-gray-700 font-semibold text-center py-3.5 rounded-xl hover:border-gray-300 transition-colors text-sm"
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </main>
    </>
  )
}
