import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { requireUser } from '@/lib/auth/requireUser'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Payments not yet configured' }, { status: 503 })
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const { id: bookingId } = await params

  let userCtx: Awaited<ReturnType<typeof requireUser>>
  try {
    userCtx = await requireUser()
  } catch (res) {
    return res as NextResponse
  }

  const supabase = await createAdminClient()

  const { data: booking } = await supabase
    .from('bookings')
    .select('id, deposit_amount, status, listing_id, listings(title)')
    .eq('id', bookingId)
    .eq('hunter_id', userCtx.user.id)
    .single()

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  if (booking.status !== 'confirmed') return NextResponse.json({ error: 'Booking not confirmed' }, { status: 400 })
  if (!booking.deposit_amount) return NextResponse.json({ error: 'No deposit required' }, { status: 400 })

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: userCtx.profile.email,
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: Math.round(booking.deposit_amount * 100),
        product_data: { name: `Deposit — ${(booking as any).listings?.title}` },
      },
      quantity: 1,
    }],
    metadata: { type: 'booking_deposit', booking_id: bookingId },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings?paid=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/bookings`,
  })

  return NextResponse.json({ url: session.url })
}
