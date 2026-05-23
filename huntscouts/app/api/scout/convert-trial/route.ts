import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Payments not yet configured' }, { status: 503 })
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  const resend = new Resend(process.env.RESEND_API_KEY)
  let userCtx: Awaited<ReturnType<typeof requireUser>>
  try {
    userCtx = await requireUser()
  } catch (res) {
    return res as NextResponse
  }

  const supabase = await createAdminClient()
  const profile = await supabase
    .from('users')
    .select('stripe_customer_id, stripe_payment_method_id, scout_status')
    .eq('id', userCtx.user.id)
    .single()

  const { stripe_customer_id, stripe_payment_method_id } = profile.data ?? {}

  if (!stripe_customer_id || !stripe_payment_method_id) {
    await supabase.from('users').update({ scout_status: 'free' }).eq('id', userCtx.user.id)
    return NextResponse.json({ converted: false, reason: 'no_payment_method' })
  }

  try {
    const subscription = await stripe.subscriptions.create({
      customer: stripe_customer_id,
      items: [{ price: process.env.STRIPE_SCOUT_MONTHLY_PRICE_ID! }],
      default_payment_method: stripe_payment_method_id,
    })

    await supabase
      .from('users')
      .update({
        scout_status: 'active',
        stripe_subscription_id: subscription.id,
        scout_subscription_status: 'active',
        scout_current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
      })
      .eq('id', userCtx.user.id)

    await resend.emails.send({
      from: 'HuntScouts <notifications@huntscouts.com>',
      to: userCtx.profile.email,
      subject: 'Welcome to Scout Pro!',
      html: `<p>Hi ${userCtx.profile.full_name ?? 'there'},</p><p>Your Scout Pro trial has converted to an active subscription. Welcome to Scout Pro!</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/scout">Open Scout →</a></p><p>— HuntScouts</p>`,
    })

    return NextResponse.json({ converted: true })
  } catch {
    await supabase.from('users').update({ scout_status: 'free' }).eq('id', userCtx.user.id)

    await resend.emails.send({
      from: 'HuntScouts <notifications@huntscouts.com>',
      to: userCtx.profile.email,
      subject: 'Your Scout Pro trial has ended',
      html: `<p>Hi ${userCtx.profile.full_name ?? 'there'},</p><p>Your Scout Pro trial ended but we couldn't charge your card. You've been moved to the free tier.</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/scout/upgrade">Re-subscribe to Scout Pro →</a></p><p>— HuntScouts</p>`,
    })

    return NextResponse.json({ converted: false, reason: 'payment_failed' })
  }
}
