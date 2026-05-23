'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function AdminVerifyButton({ outfitterId }: { outfitterId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function verify() {
    setLoading(true)
    const supabase = createClient()
    await supabase.from('outfitter_profiles').update({ license_verified: true }).eq('id', outfitterId)
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={verify}
      disabled={loading}
      className="text-xs bg-amber-400 text-black px-3 py-1.5 rounded-xl font-black hover:bg-amber-500 disabled:opacity-50 transition-colors"
    >
      {loading ? '...' : 'Verify'}
    </button>
  )
}
