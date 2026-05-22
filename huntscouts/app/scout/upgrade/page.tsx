'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { trackEvent, GA_EVENTS } from '@/lib/analytics'

export default function ScoutUpgradePage() {
  const router = useRouter()
  const [loading, setLoading] = useState<'monthly' | 'annual' | null>(null)

  async function subscribe(plan: 'monthly' | 'annual') {
    setLoading(plan)
    trackEvent(GA_EVENTS.SCOUT_UPGRADE_CLICKED, { plan })
    const res = await fetch('/api/scout/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })

    if (res.status === 401) {
      router.push('/signup?next=/scout/upgrade')
      return
    }

    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[#1B4332] mb-3">Scout Pro</h1>
          <p className="text-gray-500 text-lg">
            Stop guessing. Apply for the right unit with actual data and AI strategy.
          </p>
        </div>

        {/* Trial CTA */}
        <div className="bg-[#1B4332] text-white rounded-2xl p-6 mb-8 text-center">
          <p className="text-lg font-bold mb-1">Try Scout Pro free for 7 days</p>
          <p className="text-green-200 text-sm mb-4">Card required — you won't be charged until day 8. Cancel anytime. 20 AI queries included.</p>
          <button
            onClick={() => router.push('/scout/trial')}
            className="bg-white text-[#1B4332] px-6 py-2.5 rounded-lg font-medium hover:bg-green-50 transition-colors"
          >
            Start Free Trial — Enter Card
          </button>
        </div>

        <div className="text-center text-sm text-gray-400 mb-4">— or subscribe directly —</div>

        <div className="grid grid-cols-2 gap-6 mb-12">
          {/* Monthly */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <div className="text-2xl font-bold text-gray-900 mb-1">$9.99<span className="text-base font-normal text-gray-400">/mo</span></div>
            <div className="text-gray-500 text-sm mb-6">Billed monthly</div>
            <button
              onClick={() => subscribe('monthly')}
              disabled={!!loading}
              className="w-full bg-[#1B4332] text-white py-3 rounded-xl font-medium hover:bg-[#163828] transition-colors disabled:opacity-50"
            >
              {loading === 'monthly' ? 'Redirecting...' : 'Start monthly'}
            </button>
          </div>

          {/* Annual */}
          <div className="bg-[#1B4332] text-white rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-4 right-4 bg-amber-400 text-amber-900 text-xs font-bold px-2 py-1 rounded-full">2 MONTHS FREE</div>
            <div className="text-2xl font-bold mb-1">$99<span className="text-base font-normal text-green-300">/yr</span></div>
            <div className="text-green-200 text-sm mb-6">$8.25/mo — billed annually</div>
            <button
              onClick={() => subscribe('annual')}
              disabled={!!loading}
              className="w-full bg-white text-[#1B4332] py-3 rounded-xl font-medium hover:bg-green-50 transition-colors disabled:opacity-50"
            >
              {loading === 'annual' ? 'Redirecting...' : 'Start annual'}
            </button>
          </div>
        </div>

        {/* Features list */}
        <div className="bg-gray-50 rounded-2xl p-8">
          <h2 className="font-semibold text-gray-900 mb-5">Everything in Scout Pro</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              'Draw odds table for CO, WY, MT, UT, ID, AZ, NV',
              'AI strategy conversation — ask anything',
              'Multi-year draw trend projections',
              'Unit recommendations based on your points',
              'Compare "apply now vs wait" scenarios',
              'Outfitter recommendations by unit',
              'All unit options ranked for your exact points',
              'Unlimited queries per season',
            ].map(f => (
              <div key={f} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-[#1B4332] font-bold mt-0.5">✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Cancel anytime. Questions? <Link href="mailto:support@huntscouts.com" className="underline">support@huntscouts.com</Link>
        </p>
      </main>
    </>
  )
}
