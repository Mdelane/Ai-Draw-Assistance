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
          className="text-xs bg-[#1B4332] text-white px-3 py-1.5 rounded-xl font-black hover:bg-[#163828] disabled:opacity-50 transition-colors"
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
      className="text-xs border border-stone-300 text-gray-600 px-3 py-1.5 rounded-xl font-bold hover:border-[#1B4332] hover:text-[#1B4332] transition-colors"
    >
      Mark complete
    </button>
  )
}
