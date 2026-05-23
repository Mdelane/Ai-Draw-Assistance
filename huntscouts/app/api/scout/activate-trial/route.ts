import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'Payments not yet configured' }, { status: 503 })
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
  let userCtx: Awaited<ReturnType<typeof requireUser>>
  try {
    userCtx = await requireUser()
  } catch (res) {
    return res as NextResponse
  }

  const { setupIntentId } = await req.json()
  if (!setupIntentId) return NextResponse.json({ error: 'Missing setupIntentId' }, { status: 400 })

  const setupIntent = await stripe.setupIntents.retrieve(setupIntentId)
  if (setupIntent.status !== 'succeeded') {
    return NextResponse.json({ error: 'Card not confirmed' }, { status: 400 })
  }

  const paymentMethodId = setupIntent.payment_method as string
  const customerId = setupIntent.customer as string

  // $1 authorization — immediately cancelled to prove card is real
  try {
    const authIntent = await stripe.paymentIntents.create({
      amount: 100,
      currency: 'usd',
      customer: customerId,
      payment_method: paymentMethodId,
      capture_method: 'manual',
      confirm: true,
      off_session: true,
    })
    await stripe.paymentIntents.cancel(authIntent.id)
  } catch {
    // Card auth failed — don't activate trial
    return NextResponse.json({ error: 'Card authorization failed — please try a different card.' }, { status: 402 })
  }

  const supabase = await createAdminClient()
  const trialStart = new Date()
  const trialEnd = new Date(trialStart)
  trialEnd.setDate(trialEnd.getDate() + 7)

  await supabase
    .from('users')
    .update({
      stripe_payment_method_id: paymentMethodId,
      stripe_customer_id: customerId,
      scout_status: 'trial',
      scout_trial_start: trialStart.toISOString(),
      scout_trial_end: trialEnd.toISOString(),
      scout_trial_queries_used: 0,
    })
    .eq('id', userCtx.user.id)

  return NextResponse.json({ ok: true })
}
