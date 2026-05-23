import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createAdminClient } from '@/lib/supabase/server'
import { sendDepositConfirmed } from '@/lib/email'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Payments not yet configured' }, { status: 503 })
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const metadata = session.metadata ?? {}

      if (metadata.type === 'booking_deposit') {
        await supabase
          .from('bookings')
          .update({ deposit_paid: true, stripe_payment_intent_id: session.payment_intent as string })
          .eq('id', metadata.booking_id)

        // Send deposit confirmation emails
        try {
          const { data: booking } = await supabase
            .from('bookings')
            .select('start_date, end_date, listings(title), hunter:users!hunter_id(email, full_name), outfitter_profile:outfitter_profiles(business_name, users(email))')
            .eq('id', metadata.booking_id)
            .single()

          if (booking) {
            const b = booking as any
            await sendDepositConfirmed({
              hunterEmail: b.hunter.email,
              outfitterEmail: b.outfitter_profile.users.email,
              hunterName: b.hunter.full_name ?? 'Hunter',
              outfitterName: b.outfitter_profile.business_name,
              listingTitle: b.listings.title,
              startDate: b.start_date,
              endDate: b.end_date,
            })
          }
        } catch (emailErr) {
          console.error('Deposit email failed:', emailErr)
        }
      }
      break
    }

    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (!userId) break

      await supabase
        .from('users')
        .update({
          scout_subscription_status: sub.status === 'active' ? 'active' : 'cancelled',
          scout_stripe_customer_id: sub.customer as string,
          scout_stripe_subscription_id: sub.id,
          scout_current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
        })
        .eq('id', userId)
      break
    }

    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription
      const userId = sub.metadata?.user_id
      if (!userId) break

      await supabase
        .from('users')
        .update({ scout_subscription_status: 'cancelled' })
        .eq('id', userId)
      break
    }
  }

  return NextResponse.json({ received: true })
}
