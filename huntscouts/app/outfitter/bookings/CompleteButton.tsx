'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function CompleteButton({ bookingId }: { bookingId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  async function handleComplete() {
    if (!confirmed) { setConfirmed(true); return }
    setLoading(true)
    await fetch(`/api/bookings/${bookingId}/complete`, { method: 'POST' })
    router.refresh()
  }

  if (confirmed) {
    return (
      <div className="flex gap-2">
        <button
          onClick={handleComplete}
          disabled={loading}
          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {loading ? '...' : 'Yes, mark complete'}
        </button>
        <button
          onClick={() => setConfirmed(false)}
          className="text-xs text-gray-400 hover:text-gray-600"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleComplete}
      className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded-lg font-medium hover:border-green-400 hover:text-green-700 transition-colors"
    >
      Mark complete
    </button>
  )
}
