import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { createAdminClient } from '@/lib/supabase/server'
import { sendBookingRequest, sendBookingRequestConfirmation } from '@/lib/email'

export async function POST(req: NextRequest) {
  let userCtx: Awaited<ReturnType<typeof requireUser>>
  try {
    userCtx = await requireUser()
  } catch (res) {
    return res as NextResponse
  }

  const body = await req.json()
  const { listing_id, start_date, end_date, party_size, message_to_outfitter } = body
  const supabase = await createAdminClient()

  const { data: listing } = await supabase
    .from('listings')
    .select('id, title, base_price, deposit_amount, booking_type, outfitter_profiles(id, business_name, user_id, users(email, full_name))')
    .eq('id', listing_id)
    .single()

  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  const outfitter = listing.outfitter_profiles as any
  const total_price = listing.base_price * party_size

  const { data: booking, error } = await supabase
    .from('bookings')
    .insert({
      listing_id,
      hunter_id: userCtx.user.id,
      outfitter_id: outfitter.id,
      status: 'pending',
      start_date,
      end_date,
      party_size,
      total_price,
      deposit_amount: listing.deposit_amount,
      deposit_paid: false,
      booking_type: listing.booking_type,
      message_to_outfitter: message_to_outfitter || null,
    })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Send emails (non-blocking — don't fail the booking if email fails)
  try {
    await Promise.all([
      sendBookingRequest({
        outfitterEmail: outfitter.users.email,
        outfitterName: outfitter.business_name,
        hunterName: userCtx.profile.full_name ?? 'A hunter',
        listingTitle: listing.title,
        startDate: start_date,
        endDate: end_date,
        partySize: party_size,
        bookingId: booking.id,
      }),
      sendBookingRequestConfirmation({
        hunterEmail: userCtx.profile.email,
        hunterName: userCtx.profile.full_name ?? 'Hunter',
        listingTitle: listing.title,
        startDate: start_date,
        endDate: end_date,
      }),
    ])
  } catch (emailErr) {
    console.error('Email send failed:', emailErr)
  }

  return NextResponse.json({ booking_id: booking.id })
}
