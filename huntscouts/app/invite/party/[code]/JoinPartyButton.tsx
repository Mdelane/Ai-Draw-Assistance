'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function JoinPartyButton({
  roomId,
  userName,
  disabled,
}: {
  roomId: string
  userName: string
  disabled: boolean
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleJoin() {
    setLoading(true)
    setError(null)

    const res = await fetch(`/api/party/${roomId}/join`, { method: 'POST' })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Could not join room')
      setLoading(false)
      return
    }

    router.push(`/party/${roomId}`)
  }

  return (
    <div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-3">
          {error}
        </div>
      )}
      <button
        onClick={handleJoin}
        disabled={loading || disabled}
        className="w-full bg-amber-400 text-black font-black py-3.5 rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-50"
      >
        {loading ? 'Joining...' : `Join as ${userName} →`}
      </button>
    </div>
  )
}
