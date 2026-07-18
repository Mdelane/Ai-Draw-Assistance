'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeadlineReviewActions({ rowId }: { rowId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'dismiss' | null>(null)

  async function act(action: 'approve' | 'dismiss') {
    setLoading(action)
    await fetch(`/api/admin/deadlines/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rowId }),
    })
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => act('approve')}
        disabled={loading !== null}
        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-xl font-black hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {loading === 'approve' ? '...' : 'Approve'}
      </button>
      <button
        onClick={() => act('dismiss')}
        disabled={loading !== null}
        className="text-xs bg-stone-200 text-stone-700 px-3 py-1.5 rounded-xl font-black hover:bg-stone-300 disabled:opacity-50 transition-colors"
      >
        {loading === 'dismiss' ? '...' : 'Dismiss'}
      </button>
    </div>
  )
}
