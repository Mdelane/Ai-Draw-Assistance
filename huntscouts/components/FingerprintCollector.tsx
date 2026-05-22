'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

// Requires: npm install @thumbmarkjs/thumbmarkjs
// Silently collects device fingerprint on first authenticated session.
export default function FingerprintCollector() {
  useEffect(() => {
    async function collect() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Skip if already collected
      const { data: profile } = await supabase
        .from('users')
        .select('device_fingerprint')
        .eq('id', user.id)
        .single()

      if (profile?.device_fingerprint) return

      try {
        const { getFingerprint } = await import('@thumbmarkjs/thumbmarkjs')
        const fingerprint = await getFingerprint()
        await fetch('/api/auth/fingerprint', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fingerprint }),
        })
      } catch {
        // ThumbmarkJS failed or not installed — silent fail
      }
    }
    collect()
  }, [])

  return null
}
