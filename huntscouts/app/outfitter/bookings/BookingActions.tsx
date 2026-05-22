'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BookingActions({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'confirm' | 'decline' | null>(null)

  async function handleAction(action: 'confirm' | 'decline') {
    setLoading(action)
    await fetch(`/api/bookings/${bookingId}/${action}`, { method: 'POST' })
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex gap-2 mt-2">
      <button
        onClick={() => handleAction('confirm')}
        disabled={!!loading}
        className="text-xs bg-[#1B4332] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#163828] disabled:opacity-50 transition-colors"
      >
        {loading === 'confirm' ? '...' : 'Confirm'}
      </button>
      <button
        onClick={() => handleAction('decline')}
        disabled={!!loading}
        className="text-xs bg-white border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:border-red-300 hover:text-red-600 disabled:opacity-50 transition-colors"
      >
        {loading === 'decline' ? '...' : 'Decline'}
      </button>
    </div>
  )
}
