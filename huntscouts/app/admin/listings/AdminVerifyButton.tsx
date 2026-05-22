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
      className="text-xs bg-[#1B4332] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#163828] disabled:opacity-50 transition-colors"
    >
      {loading ? '...' : 'Verify'}
    </button>
  )
}
