import { createClient, createAdminClient } from '@/lib/supabase/server'
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

  const adminSupabase = await createAdminClient()
  const { data: outfitterProfile } = await adminSupabase
    .from('outfitter_profiles')
    .select('id, bookings_completed_count, pilot_bookings_remaining')
    .eq('id', booking.outfitter_id)
    .single()

  if (outfitterProfile) {
    const newCount = (outfitterProfile.bookings_completed_count ?? 0) + 1
    const newPilot = Math.max(0, (outfitterProfile.pilot_bookings_remaining ?? 0) - 1)
    await adminSupabase
      .from('outfitter_profiles')
      .update({
        bookings_completed_count: newCount,
        pilot_bookings_remaining: newPilot,
      })
      .eq('id', outfitterProfile.id)
  }

  return NextResponse.json({ ok: true })
}
