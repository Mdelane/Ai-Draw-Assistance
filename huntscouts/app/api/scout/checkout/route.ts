import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { requireUser } from '@/lib/auth/requireUser'

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
  let userCtx: Awaited<ReturnType<typeof requireUser>>
  try {
    userCtx = await requireUser()
  } catch (res) {
    return res as NextResponse
  }

  const { plan } = await req.json() // 'monthly' | 'annual'

  const priceId = plan === 'annual'
    ? process.env.STRIPE_SCOUT_ANNUAL_PRICE_ID!
    : process.env.STRIPE_SCOUT_MONTHLY_PRICE_ID!

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: userCtx.profile.email,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { metadata: { user_id: userCtx.user.id } },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/scout?subscribed=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/scout/upgrade`,
  })

  return NextResponse.json({ url: session.url })
}
