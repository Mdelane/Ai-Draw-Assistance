'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { loadStripe, type Stripe, type StripeElements } from '@stripe/stripe-js'

export default function ScoutTrialPage() {
  const router = useRouter()
  const [stripe, setStripe] = useState<Stripe | null>(null)
  const [elements, setElements] = useState<StripeElements | null>(null)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const paymentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function init() {
      const res = await fetch('/api/scout/create-trial', { method: 'POST' })
      if (res.status === 401) { router.push('/signup?next=/scout/trial'); return }
      if (!res.ok) { setError('Could not initialize trial — try again.'); setLoading(false); return }

      const { clientSecret } = await res.json()
      setClientSecret(clientSecret)

      const stripeInstance = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
      if (!stripeInstance) { setError('Stripe failed to load.'); setLoading(false); return }

      setStripe(stripeInstance)
      const els = stripeInstance.elements({ clientSecret, appearance: { theme: 'stripe' } })
      const paymentEl = els.create('payment')
      if (paymentRef.current) paymentEl.mount(paymentRef.current)
      setElements(els)
      setLoading(false)
    }
    init()
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!stripe || !elements || !clientSecret) return
    setSubmitting(true)
    setError(null)

    const { setupIntent, error: stripeError } = await stripe.confirmSetup({
      elements,
      redirect: 'if_required',
      confirmParams: { return_url: `${window.location.origin}/scout/trial` },
    })

    if (stripeError) {
      setError(stripeError.message ?? 'Card error — please try again.')
      setSubmitting(false)
      return
    }

    if (setupIntent?.status === 'succeeded') {
      const res = await fetch('/api/scout/activate-trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ setupIntentId: setupIntent.id }),
      })

      if (!res.ok) {
        const { error: msg } = await res.json()
        setError(msg ?? 'Could not activate trial.')
        setSubmitting(false)
        return
      }

      router.push('/scout?trial=activated')
    }
  }

  return (
    <>
      <Navbar />
      <main className="max-w-md mx-auto px-6 py-16">
        <Link href="/scout/upgrade" className="text-sm text-gray-400 hover:text-gray-600 mb-8 block">
          ← Back to upgrade
        </Link>

        <h1 className="text-2xl font-bold text-[#1B4332] mb-2">Start your free trial</h1>
        <p className="text-gray-500 text-sm mb-8">
          7 days free — card required. You won't be charged until day 8. Cancel anytime.
        </p>

        {loading && (
          <div className="text-sm text-gray-400 text-center py-8">Loading payment form...</div>
        )}

        <form onSubmit={handleSubmit} className={loading ? 'hidden' : ''}>
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3 mb-4">{error}</div>
          )}

          <div ref={paymentRef} className="mb-6" />

          <button
            type="submit"
            disabled={submitting || loading}
            className="w-full bg-[#1B4332] text-white py-3 rounded-xl font-medium hover:bg-[#163828] transition-colors disabled:opacity-50"
          >
            {submitting ? 'Activating trial...' : 'Start 7-day free trial'}
          </button>

          <p className="text-xs text-gray-400 text-center mt-4">
            A $1 authorization confirms your card is valid. It releases immediately — you are not charged.
          </p>
        </form>

        <div className="mt-8 bg-gray-50 rounded-xl p-5 text-sm text-gray-600 space-y-2">
          <div className="flex gap-2">
            <span className="text-[#1B4332] font-bold">✓</span>
            <span>20 AI strategy queries during your trial</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[#1B4332] font-bold">✓</span>
            <span>Full draw odds table — all 7 western states</span>
          </div>
          <div className="flex gap-2">
            <span className="text-[#1B4332] font-bold">✓</span>
            <span>Converts to $9.99/mo on day 8 unless cancelled</span>
          </div>
        </div>
      </main>
    </>
  )
}
