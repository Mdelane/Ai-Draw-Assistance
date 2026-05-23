import { notFound } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { calculatePartyStrategy } from '@/lib/scout/partyStrategy'
import { CopyInviteButton, LockRoomButton, ShareInviteButton } from './PartyRoomActions'

export default async function PartyRoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: roomId } = await params
  const supabase = await createClient()
  const adminSupabase = await createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()

  const { data: room } = await adminSupabase
    .from('party_hunt_rooms')
    .select('id, owner_user_id, state, species, weapon_type, target_year, invite_code, status, best_unit, group_odds')
    .eq('id', roomId)
    .single()

  if (!room) notFound()

  const { data: members } = await adminSupabase
    .from('party_hunt_members')
    .select('id, user_id, points, joined_at, users(full_name)')
    .eq('room_id', roomId)
    .order('joined_at', { ascending: true })

  const strategy = await calculatePartyStrategy(
    roomId,
    room.state,
    room.species,
    room.weapon_type,
    room.target_year
  )

  const isOwner = user?.id === room.owner_user_id
  const inviteUrl = `https://huntscouts.com/invite/party/${room.invite_code}`

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1B4332] mb-2">Party Hunt Room</p>
        <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-1 capitalize">
          {room.state} {room.species} — {room.weapon_type}
        </h1>
        <p className="text-gray-500 text-sm mb-1">
          Target year: {room.target_year}
        </p>
        <div className="flex items-center gap-2 mb-8">
          <span className={`text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
            room.status === 'open' ? 'bg-green-100 text-green-700'
            : room.status === 'locked' ? 'bg-gray-200 text-gray-600'
            : 'bg-red-100 text-red-600'
          }`}>
            {room.status}
          </span>
        </div>

        {/* Invite link */}
        <div className="bg-stone-100 border border-stone-200 rounded-xl px-4 py-3 mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">Invite link</p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-700 truncate flex-1 font-mono select-all">{inviteUrl}</span>
            <CopyInviteButton inviteUrl={inviteUrl} />
          </div>
        </div>

        {/* Members */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">
            Party Members ({(members ?? []).length})
          </p>
          <div className="bg-white border border-gray-200 rounded-xl divide-y divide-gray-100 overflow-hidden">
            {(members ?? []).map((m: any) => (
              <div key={m.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {m.users?.full_name ?? 'Anonymous'}
                    {m.user_id === room.owner_user_id && (
                      <span className="ml-2 text-xs font-bold text-[#1B4332] uppercase tracking-widest">Owner</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Joined {new Date(m.joined_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{m.points ?? 0} pts</p>
                </div>
              </div>
            ))}
            {(members ?? []).length === 0 && (
              <div className="px-5 py-6 text-sm text-gray-400 text-center">No members yet</div>
            )}
          </div>
        </div>

        {/* Strategy result */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Group Draw Strategy</p>
          {strategy.memberCount < 2 ? (
            <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl px-5 py-6 text-center text-gray-500 text-sm">
              Add more members to calculate group draw strategy.
            </div>
          ) : strategy.bestUnit ? (
            <div className="bg-[#1B4332] text-white rounded-xl px-5 py-5 mb-5">
              <p className="text-xs font-bold uppercase tracking-widest text-green-300 mb-1">Best unit for your group</p>
              <p className="text-3xl font-black tracking-tight mb-1">{strategy.bestUnit}</p>
              <p className="text-green-200 text-sm">
                {strategy.groupOdds != null ? `${strategy.groupOdds}% draw odds` : '—'} &middot; based on {strategy.minPointsInGroup} pts (lowest in group)
              </p>
            </div>
          ) : (
            <div className="bg-stone-50 border border-dashed border-stone-300 rounded-xl px-5 py-6 text-center text-gray-500 text-sm">
              No reachable units found for this group's lowest point total ({strategy.minPointsInGroup} pts).
            </div>
          )}

          {strategy.reachableUnits.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Unit</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Draw Odds</th>
                    <th className="text-left px-5 py-3 font-medium text-gray-600">Min Points</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {strategy.reachableUnits.map((u, i) => (
                    <tr key={u.unit_number} className={i === 0 ? 'bg-green-50' : ''}>
                      <td className="px-5 py-3 font-medium text-gray-900">{u.unit_number}</td>
                      <td className="px-5 py-3 text-gray-700">{u.draw_odds_percent}%</td>
                      <td className="px-5 py-3 text-gray-600">{u.min_points_drawn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Owner actions */}
        {isOwner && room.status === 'open' && (
          <div className="flex gap-3">
            <LockRoomButton roomId={roomId} />
            <ShareInviteButton inviteUrl={inviteUrl} />
          </div>
        )}
        {isOwner && room.status !== 'open' && (
          <ShareInviteButton inviteUrl={inviteUrl} />
        )}
      </main>
    </>
  )
}
