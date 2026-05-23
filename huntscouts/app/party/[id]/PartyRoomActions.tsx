'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function CopyInviteButton({ inviteUrl }: { inviteUrl: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 text-xs font-bold uppercase tracking-widest text-[#1B4332] hover:underline"
    >
      {copied ? 'Copied!' : 'Copy link'}
    </button>
  )
}

export function LockRoomButton({ roomId }: { roomId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLock() {
    setLoading(true)
    await fetch(`/api/party/${roomId}/lock`, { method: 'POST' })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={handleLock}
      disabled={loading}
      className="border border-gray-300 text-gray-700 text-sm font-bold px-4 py-2 rounded-xl hover:border-gray-400 transition-colors disabled:opacity-50"
    >
      {loading ? 'Locking...' : 'Lock Room'}
    </button>
  )
}

export function ShareInviteButton({ inviteUrl }: { inviteUrl: string }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: 'Join my party hunt room on HuntScouts', url: inviteUrl })
        return
      } catch {}
    }
    await navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleShare}
      className="bg-amber-400 text-black font-black text-sm px-4 py-2 rounded-xl hover:bg-amber-300 transition-colors"
    >
      {copied ? 'Link copied!' : 'Share Invite'}
    </button>
  )
}
