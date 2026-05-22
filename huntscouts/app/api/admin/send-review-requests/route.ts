import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendReviewRequest } from '@/lib/email'

// Secured by CRON_SECRET — call this daily from a cron job or Vercel Cron
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  // Find completed hunts that haven't been reviewed yet
  const { data: bookings } = await supabase
    .from('bookings')
    .select('id, listing_id, start_date, end_date, listings(title), hunter:users!hunter_id(email, full_name)')
    .eq('status', 'confirmed')
    .eq('deposit_paid', true)
    .lt('end_date', today)
    .not('id', 'in', `(select booking_id from reviews where booking_id is not null)`)

  if (!bookings?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const b of bookings as any[]) {
    try {
      await sendReviewRequest({
        hunterEmail: b.hunter.email,
        hunterName: b.hunter.full_name ?? 'Hunter',
        listingTitle: b.listings?.title ?? 'your hunt',
        listingId: b.listing_id,
        bookingId: b.id,
      })
      sent++
    } catch (err) {
      console.error(`Review request failed for booking ${b.id}:`, err)
    }
  }

  return NextResponse.json({ sent })
}
