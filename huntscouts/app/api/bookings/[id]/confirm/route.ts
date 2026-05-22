import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { requireUser } from '@/lib/auth/requireUser'
import { createAdminClient } from '@/lib/supabase/server'
import { sendBookingConfirmed } from '@/lib/email'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
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
    .select('id, start_date, end_date, deposit_amount, listings(title), hunter:users!hunter_id(email, full_name)')
    .eq('id', bookingId)
    .single()

  if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await supabase.from('bookings').update({ status: 'confirmed' }).eq('id', bookingId)

  const b = booking as any
  let paymentUrl: string | null = null

  // Create Stripe checkout for deposit if needed
  if (b.deposit_amount) {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card'],
        customer_email: b.hunter.email,
        line_items: [{
          price_data: {
            currency: 'usd',
            unit_amount: Math.round(b.deposit_amount * 100),
            product_data: { name: `Deposit — ${b.listings?.title}` },
          },
          quantity: 1,
        }],
        metadata: { type: 'booking_deposit', booking_id: bookingId },
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings?paid=1`,
        cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings`,
      })
      paymentUrl = session.url
    } catch (stripeErr) {
      console.error('Stripe session creation failed:', stripeErr)
    }
  }

  try {
    await sendBookingConfirmed({
      hunterEmail: b.hunter.email,
      hunterName: b.hunter.full_name ?? 'Hunter',
      listingTitle: b.listings?.title ?? 'your hunt',
      startDate: b.start_date,
      endDate: b.end_date,
      depositAmount: b.deposit_amount,
      paymentUrl,
    })
  } catch (emailErr) {
    console.error('Confirm email failed:', emailErr)
  }

  return NextResponse.json({ success: true })
}
