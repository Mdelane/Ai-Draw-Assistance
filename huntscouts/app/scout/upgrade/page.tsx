'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import { trackEvent, GA_EVENTS } from '@/lib/analytics'

const FEATURES = [
  'AI strategy conversation — ask anything',
  'Unit recommendations based on your points',
  'Multi-year draw trend projections',
  'Compare "apply now vs wait" scenarios',
  'All units ranked for your exact point total',
  'Outfitter recommendations by unit',
  'Unlimited queries per season',
  'Draw odds table for 7 western states',
]

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

        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-[#1B4332]/10 text-[#1B4332] text-xs font-black uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            Scout Pro
          </div>
          <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-4">
            Stop guessing.<br />
            <span className="text-[#1B4332]">Apply smarter.</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            Real FOIA draw data + AI strategy tells you exactly which unit to apply for and when.
          </p>
        </div>

        {/* Trial CTA */}
        <div className="bg-[#1B4332] text-white rounded-2xl p-8 mb-8 relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative flex items-center justify-between gap-6 flex-wrap">
            <div>
              <p className="text-xl font-black mb-1">Try Scout Pro free for 7 days</p>
              <p className="text-green-300 text-sm">Card required · not charged until day 8 · cancel anytime · 20 AI queries included</p>
            </div>
            <button
              onClick={() => router.push('/scout/trial')}
              className="shrink-0 bg-amber-400 text-gray-900 px-7 py-3.5 rounded-xl font-black hover:bg-amber-300 transition-colors text-sm"
            >
              Start Free Trial →
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">or subscribe directly</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-2 gap-5 mb-14">
          {/* Monthly */}
          <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 hover:border-[#1B4332] transition-colors">
            <div className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Monthly</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-black text-gray-900">$9.99</span>
              <span className="text-gray-400 text-sm font-medium">/mo</span>
            </div>
            <p className="text-gray-400 text-xs mb-7">Billed monthly · cancel anytime</p>
            <button
              onClick={() => subscribe('monthly')}
              disabled={!!loading}
              className="w-full bg-[#1B4332] text-white py-3.5 rounded-xl font-bold hover:bg-[#163828] transition-colors disabled:opacity-50 text-sm"
            >
              {loading === 'monthly' ? 'Redirecting...' : 'Get Scout Pro'}
            </button>
          </div>

          {/* Annual */}
          <div className="bg-[#1B4332] text-white rounded-2xl p-8 relative overflow-hidden">
            <div className="absolute top-5 right-5 bg-amber-400 text-amber-900 text-xs font-black px-3 py-1 rounded-full">
              SAVE 17%
            </div>
            <div className="text-xs font-black uppercase tracking-widest text-green-400 mb-4">Annual</div>
            <div className="flex items-baseline gap-1 mb-1">
              <span className="text-4xl font-black">$99</span>
              <span className="text-green-300 text-sm font-medium">/yr</span>
            </div>
            <p className="text-green-300 text-xs mb-7">$8.25/mo — 2 months free</p>
            <button
              onClick={() => subscribe('annual')}
              disabled={!!loading}
              className="w-full bg-amber-400 text-gray-900 py-3.5 rounded-xl font-black hover:bg-amber-300 transition-colors disabled:opacity-50 text-sm"
            >
              {loading === 'annual' ? 'Redirecting...' : 'Best value'}
            </button>
          </div>
        </div>

        {/* Features */}
        <div className="bg-stone-50 border border-stone-200 rounded-2xl p-8">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">Everything included in Scout Pro</h2>
          <div className="grid grid-cols-2 gap-3">
            {FEATURES.map(f => (
              <div key={f} className="flex items-start gap-3 text-sm text-gray-700">
                <span className="w-5 h-5 bg-[#1B4332] text-white rounded-full flex items-center justify-center text-xs font-black shrink-0 mt-0.5">✓</span>
                {f}
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Cancel anytime. No hidden fees. Questions?{' '}
          <Link href="mailto:support@huntscouts.com" className="underline hover:text-gray-600">support@huntscouts.com</Link>
        </p>
      </main>
    </>
  )
}
