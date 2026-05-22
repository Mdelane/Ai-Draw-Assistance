import { createAdminClient } from '@/lib/supabase/server'

type RateLimitResult =
  | { allowed: true; remaining: number; limit: number; resetDate: string }
  | { allowed: false; remaining: 0; limit: number; resetDate: string }

export async function checkScoutRateLimit(userId: string, isPaidUser: boolean): Promise<RateLimitResult> {
  const supabase = await createAdminClient()

  const { data: userData, error } = await supabase
    .from('users')
    .select('scout_queries_this_month, scout_queries_month_reset, scout_status, scout_trial_queries_used')
    .eq('id', userId)
    .single()

  if (error || !userData) {
    return { allowed: false, remaining: 0, limit: 0, resetDate: '' }
  }

  const now = new Date()
  const resetDate = userData.scout_queries_month_reset
    ? new Date(userData.scout_queries_month_reset)
    : new Date(now.getFullYear(), now.getMonth(), 1)

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const needsReset = resetDate < startOfMonth

  if (needsReset) {
    await supabase
      .from('users')
      .update({
        scout_queries_this_month: 0,
        scout_queries_month_reset: now.toISOString().split('T')[0],
      })
      .eq('id', userId)
    userData.scout_queries_this_month = 0
  }

  // Trial users have their own budget tracked separately
  if (userData.scout_status === 'trial') {
    const trialLimit = 20
    const used = userData.scout_trial_queries_used ?? 0
    if (used >= trialLimit) {
      return { allowed: false, remaining: 0, limit: trialLimit, resetDate: '' }
    }
    await supabase
      .from('users')
      .update({ scout_trial_queries_used: used + 1 })
      .eq('id', userId)
    return { allowed: true, remaining: trialLimit - used - 1, limit: trialLimit, resetDate: '' }
  }

  const limit = isPaidUser ? 200 : 5
  const current = userData.scout_queries_this_month ?? 0
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  const resetDateStr = nextMonth.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  if (current >= limit) {
    return { allowed: false, remaining: 0, limit, resetDate: resetDateStr }
  }

  await supabase
    .from('users')
    .update({ scout_queries_this_month: current + 1 })
    .eq('id', userId)

  return { allowed: true, remaining: limit - current - 1, limit, resetDate: resetDateStr }
}
