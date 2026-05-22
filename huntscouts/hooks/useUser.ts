'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

type UserProfile = {
  id: string
  email: string
  full_name: string | null
  role: 'hunter' | 'outfitter' | 'admin'
  scout_subscription_status: 'none' | 'active' | 'cancelled'
}

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setUser(user)
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('id, email, full_name, role, scout_subscription_status')
          .eq('id', user.id)
          .single()
        setProfile(data)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        const { data } = await supabase
          .from('users')
          .select('id, email, full_name, role, scout_subscription_status')
          .eq('id', session.user.id)
          .single()
        setProfile(data)
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, profile, loading, isScoutPro: profile?.scout_subscription_status === 'active' }
}
