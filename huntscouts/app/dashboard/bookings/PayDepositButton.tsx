'use client'

import { useState } from 'react'

export default function PayDepositButton({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(false)

  async function handlePay() {
    setLoading(true)
    const res = await fetch(`/api/bookings/${bookingId}/checkout`, { method: 'POST' })
    const { url } = await res.json()
    window.location.href = url
  }

  return (
    <button
      onClick={handlePay}
      disabled={loading}
      className="mt-2 text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-amber-600 disabled:opacity-50 transition-colors"
    >
      {loading ? '...' : 'Pay deposit →'}
    </button>
  )
}
