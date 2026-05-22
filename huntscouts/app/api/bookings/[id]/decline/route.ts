import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { createAdminClient } from '@/lib/supabase/server'
import { sendBookingDeclined } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: bookingId } = await params

  let userCtx: Awaited<ReturnType<typeof requireUser>>
  try {
    userCtx = await requireUser()
  } catch (res) {
    return res as NextResponse
  }

  if (userCtx.profile.role !== 'outfitter' && userCtx.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const supabase = await createAdminClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, listings(title), hunter:users!hunter_id(email, full_name)')
    .eq('id', bookingId)
    .single()

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', bookingId)

  const b = booking as any
  try {
    await sendBookingDeclined({
      hunterEmail: b.hunter.email,
      hunterName: b.hunter.full_name ?? 'Hunter',
      listingTitle: b.listings?.title ?? 'your hunt',
    })
  } catch (emailErr) {
    console.error('Decline email failed:', emailErr)
  }

  return NextResponse.json({ success: true })
}
