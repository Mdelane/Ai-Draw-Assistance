import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { generateBookingAgreementHtml } from '@/lib/documents/bookingAgreementHtml'

export async function POST(req: NextRequest) {
  const { bookingId } = await req.json()
  if (!bookingId) return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 })

  const supabase = await createAdminClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select(`
      id, created_at, start_date, end_date, party_size, total_price,
      deposit_amount, stripe_payment_intent_id, hunter_ip_at_booking, tos_accepted_at,
      users!hunter_id(full_name, email),
      listings(title, species, states, cancellation_policy, booking_type),
      outfitter_profiles!outfitter_id(business_name, license_number)
    `)
    .eq('id', bookingId)
    .single()

  if (error || !booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })

  const hunter = (booking as any).users
  const listing = (booking as any).listings
  const outfitter = (booking as any).outfitter_profiles

  const html = generateBookingAgreementHtml({
    bookingId: booking.id,
    bookingCreatedAt: booking.created_at,
    hunterName: hunter?.full_name ?? 'Unknown',
    hunterEmail: hunter?.email ?? '',
    hunterIp: booking.hunter_ip_at_booking ?? 'not recorded',
    outfitterBusinessName: outfitter?.business_name ?? '',
    outfitterLicenseNumber: outfitter?.license_number ?? null,
    listingTitle: listing?.title ?? '',
    species: listing?.species ?? [],
    states: listing?.states ?? [],
    startDate: booking.start_date,
    endDate: booking.end_date,
    partySize: booking.party_size,
    totalPrice: booking.total_price ?? 0,
    depositAmount: booking.deposit_amount,
    stripePaymentIntentId: booking.stripe_payment_intent_id,
    cancellationPolicy: listing?.cancellation_policy ?? 'moderate',
    bookingType: listing?.booking_type ?? 'request',
  })

  // Upload to Supabase Storage as HTML file
  const fileName = `${bookingId}.html`
  const { error: uploadError } = await supabase.storage
    .from('booking-agreements')
    .upload(fileName, Buffer.from(html, 'utf-8'), {
      contentType: 'text/html',
      upsert: true,
    })

  if (uploadError) {
    // Fall back: store agreement URL as marker that it was generated
    console.error('Storage upload failed:', uploadError.message)
    await supabase
      .from('bookings')
      .update({ agreement_url: `generated:${bookingId}` })
      .eq('id', bookingId)
    return NextResponse.json({ ok: true, stored: 'db-only' })
  }

  const { data: { publicUrl } } = supabase.storage
    .from('booking-agreements')
    .getPublicUrl(fileName)

  await supabase
    .from('bookings')
    .update({ agreement_url: publicUrl })
    .eq('id', bookingId)

  return NextResponse.json({ ok: true, agreement_url: publicUrl })
}
