'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConfirmPublicationButton({ rowId }: { rowId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function confirm() {
    setLoading(true)
    await fetch('/api/admin/deadlines/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rowId }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={confirm}
      disabled={loading}
      className="text-xs bg-amber-400 text-black px-3 py-1.5 rounded-xl font-black hover:bg-amber-500 disabled:opacity-50 transition-colors"
    >
      {loading ? '...' : 'Confirm'}
    </button>
  )
}
