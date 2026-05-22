'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(false)

  async function openPortal() {
    setLoading(true)
    const res = await fetch('/api/scout/portal', { method: 'POST' })
    if (!res.ok) { setLoading(false); return }
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-6 py-10">
        <Link href="/account" className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">← Account settings</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Manage subscription</h1>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Scout Pro</h2>
          <p className="text-gray-500 text-sm mb-6">
            Manage your billing, update your payment method, or cancel your subscription through the Stripe customer portal.
          </p>
          <button
            onClick={openPortal}
            disabled={loading}
            className="w-full bg-[#1B4332] text-white py-3 rounded-xl font-medium hover:bg-[#163828] disabled:opacity-50 transition-colors"
          >
            {loading ? 'Opening portal...' : 'Manage billing →'}
          </button>
          <p className="text-xs text-gray-400 mt-4">
            You&apos;ll be redirected to Stripe&apos;s secure billing portal.
          </p>
        </div>
      </main>
    </>
  )
}
