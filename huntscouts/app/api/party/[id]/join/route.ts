import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params
  let userCtx: Awaited<ReturnType<typeof requireUser>>
  try { userCtx = await requireUser() } catch (res) { return res as NextResponse }

  const supabase = await createAdminClient()

  const { data: room } = await supabase
    .from('party_hunt_rooms')
    .select('id, state, species, weapon_type, status')
    .eq('id', roomId)
    .single()

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  if (room.status !== 'open') return NextResponse.json({ error: 'Room is not open' }, { status: 400 })

  const { data: existing } = await supabase
    .from('party_hunt_members')
    .select('id')
    .eq('room_id', roomId)
    .eq('user_id', userCtx.user.id)
    .single()

  if (existing) return NextResponse.json({ ok: true, alreadyMember: true })

  const { data: pointsRow } = await supabase
    .from('scout_points')
    .select('points')
    .eq('user_id', userCtx.user.id)
    .eq('state', room.state)
    .eq('species', room.species)
    .eq('weapon_type', room.weapon_type)
    .single()

  await supabase.from('party_hunt_members').insert({
    room_id: roomId,
    user_id: userCtx.user.id,
    points: pointsRow?.points ?? 0,
  })

  return NextResponse.json({ ok: true })
}
