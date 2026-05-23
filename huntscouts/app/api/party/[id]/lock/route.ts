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
    .select('id, owner_user_id')
    .eq('id', roomId)
    .single()

  if (!room) return NextResponse.json({ error: 'Room not found' }, { status: 404 })
  if (room.owner_user_id !== userCtx.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await supabase
    .from('party_hunt_rooms')
    .update({ status: 'locked' })
    .eq('id', roomId)

  return NextResponse.json({ ok: true })
}
