import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  let userCtx: Awaited<ReturnType<typeof requireUser>>
  try {
    userCtx = await requireUser()
  } catch (res) {
    return res as NextResponse
  }

  if ((userCtx.profile as any).role !== 'admin') {
    return NextResponse.json({ error: 'Admin only' }, { status: 403 })
  }

  const { bookingId } = await params
  const supabase = await createAdminClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id, created_at, start_date, end_date, party_size,
      total_price, deposit_amount, deposit_paid,
      stripe_payment_intent_id, hunter_ip_at_booking, tos_accepted_at,
      agreement_url, status,
      users!hunter_id(full_name, email),
      listings(title, cancellation_policy),
      outfitter_profiles!outfitter_id(business_name)
    `)
    .eq('id', bookingId)
    .single()

  if (error || !booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const hunter = (booking as any).users
  const listing = (booking as any).listings
  const outfitter = (booking as any).outfitter_profiles

  const CANCELLATION_TEXT: Record<string, string> = {
    flexible: 'Full refund 60+ days out; full refund 30-59 days; 50% refund under 30 days; full refund force majeure.',
    moderate: 'Full refund 60+ days out; 50% refund 30-59 days; no refund under 30 days; full refund force majeure.',
    strict: '50% refund 60+ days out; no refund under 60 days; force majeure case by case.',
  }

  return NextResponse.json({
    booking_id: booking.id,
    stripe_payment_intent_id: booking.stripe_payment_intent_id,
    hunter_name: hunter?.full_name ?? null,
    hunter_email: hunter?.email ?? null,
    booking_date: booking.created_at,
    hunt_dates: `${booking.start_date} to ${booking.end_date}`,
    total_charged: booking.total_price,
    deposit_charged: booking.deposit_amount,
    deposit_paid: booking.deposit_paid,
    outfitter_name: outfitter?.business_name ?? null,
    listing_title: listing?.title ?? null,
    cancellation_policy: CANCELLATION_TEXT[listing?.cancellation_policy ?? ''] ?? listing?.cancellation_policy ?? null,
    agreement_url: booking.agreement_url ?? null,
    booking_confirmation_email_sent_at: booking.created_at,
    hunter_ip_at_booking: booking.hunter_ip_at_booking ?? null,
    tos_accepted_at: booking.tos_accepted_at ?? null,
    booking_status: booking.status,
  })
}
