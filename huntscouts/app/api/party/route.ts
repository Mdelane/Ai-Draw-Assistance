import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  let userCtx: Awaited<ReturnType<typeof requireUser>>
  try { userCtx = await requireUser() } catch (res) { return res as NextResponse }

  const { state, species, weapon_type, target_year } = await req.json()
  if (!state || !species || !weapon_type || !target_year) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  const { data: room, error } = await supabase
    .from('party_hunt_rooms')
    .insert({
      owner_user_id: userCtx.user.id,
      state, species, weapon_type,
      target_year: parseInt(target_year),
      status: 'open',
    })
    .select('id, invite_code')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: pointsRow } = await supabase
    .from('scout_points')
    .select('points')
    .eq('user_id', userCtx.user.id)
    .eq('state', state)
    .eq('species', species)
    .eq('weapon_type', weapon_type)
    .single()

  await supabase.from('party_hunt_members').insert({
    room_id: room.id,
    user_id: userCtx.user.id,
    points: pointsRow?.points ?? 0,
  })

  return NextResponse.json({ id: room.id, invite_code: room.invite_code })
}
