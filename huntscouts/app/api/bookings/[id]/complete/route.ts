import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify caller owns the outfitter profile on this booking
  const { data: booking } = await supabase
    .from('bookings')
    .select('id, status, outfitter_id, outfitter_profiles!outfitter_id(user_id)')
    .eq('id', id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const profile = booking.outfitter_profiles as any
  if (profile?.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (booking.status !== 'confirmed') {
    return NextResponse.json({ error: 'Only confirmed bookings can be marked complete' }, { status: 400 })
  }

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'completed' })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
