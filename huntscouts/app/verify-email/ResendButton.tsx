'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResendButton({ email }: { email: string }) {
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleResend() {
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resend({ type: 'signup', email })
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <p className="text-green-700 text-sm font-medium">
        Verification email resent — check your inbox.
      </p>
    )
  }

  return (
    <button
      onClick={handleResend}
      disabled={loading}
      className="text-sm text-[#1B4332] font-medium hover:underline disabled:opacity-50"
    >
      {loading ? 'Sending...' : 'Resend verification email'}
    </button>
  )
}
