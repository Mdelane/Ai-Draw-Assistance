import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { createAdminClient } from '@/lib/supabase/server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  let userCtx: Awaited<ReturnType<typeof requireUser>>
  try {
    userCtx = await requireUser()
  } catch (res) {
    return res as NextResponse
  }

  const supabase = await createAdminClient()

  // Get or create Stripe customer
  let customerId: string = (userCtx.profile as any).stripe_customer_id

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: userCtx.profile.email,
      name: userCtx.profile.full_name ?? undefined,
      metadata: { supabase_user_id: userCtx.user.id },
    })
    customerId = customer.id
    await supabase.from('users').update({ stripe_customer_id: customerId }).eq('id', userCtx.user.id)
  }

  const setupIntent = await stripe.setupIntents.create({
    customer: customerId,
    usage: 'off_session',
    metadata: { supabase_user_id: userCtx.user.id },
  })

  return NextResponse.json({ clientSecret: setupIntent.client_secret })
}
