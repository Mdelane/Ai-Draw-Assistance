import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function requireUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('users')
    .select('id, email, full_name, role, scout_subscription_status, scout_current_period_end, scout_status, scout_trial_end, scout_trial_queries_used, scout_queries_this_month, account_flagged, stripe_customer_id, stripe_payment_method_id')
    .eq('id', user.id)
    .single()

  if (!profile) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return { user, profile }
}

export function isScoutPro(profile: {
  scout_subscription_status?: string | null
  scout_current_period_end?: string | null
  scout_status?: string | null
  scout_trial_end?: string | null
  scout_trial_queries_used?: number | null
}) {
  // Active paid subscription
  if (
    profile.scout_subscription_status === 'active' &&
    profile.scout_current_period_end &&
    new Date(profile.scout_current_period_end) > new Date()
  ) return true

  // Active trial (not expired, not exhausted)
  if (
    profile.scout_status === 'trial' &&
    profile.scout_trial_end &&
    new Date(profile.scout_trial_end) > new Date() &&
    (profile.scout_trial_queries_used ?? 0) < 20
  ) return true

  return false
}
