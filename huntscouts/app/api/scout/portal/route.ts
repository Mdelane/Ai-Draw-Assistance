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

  const customerId = (userCtx.profile as any).scout_stripe_customer_id
  if (!customerId) {
    return NextResponse.json({ error: 'No subscription found' }, { status: 400 })
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/account`,
  })

  return NextResponse.json({ url: session.url })
}
