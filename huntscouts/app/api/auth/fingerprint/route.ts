import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  let userCtx: Awaited<ReturnType<typeof requireUser>>
  try {
    userCtx = await requireUser()
  } catch (res) {
    return res as NextResponse
  }

  const { fingerprint } = await req.json()
  if (!fingerprint || typeof fingerprint !== 'string') {
    return NextResponse.json({ error: 'Invalid fingerprint' }, { status: 400 })
  }

  const supabase = await createAdminClient()

  // Count accounts with this fingerprint (excluding current user)
  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('device_fingerprint', fingerprint)
    .neq('id', userCtx.user.id)

  const existingCount = count ?? 0

  const updates: Record<string, unknown> = {
    device_fingerprint: fingerprint,
    fingerprint_collected_at: new Date().toISOString(),
  }

  if (existingCount >= 2) {
    // 3rd+ account from this device — soft block Scout
    updates.account_flagged = true
    updates.flag_reason = 'multiple_accounts_same_device'
    updates.scout_queries_this_month = 999

    await supabase.from('abuse_signals').insert({
      event_type: 'device_soft_blocked',
      user_id: userCtx.user.id,
      meta: { fingerprint, existing_count: existingCount },
    })
  } else if (existingCount === 1) {
    // 2nd existing + this = 3rd account — flag only
    updates.account_flagged = true
    updates.flag_reason = 'multiple_accounts_same_device'

    await supabase.from('abuse_signals').insert({
      event_type: 'duplicate_device_flagged',
      user_id: userCtx.user.id,
      meta: { fingerprint, existing_count: existingCount },
    })
  }

  await supabase.from('users').update(updates).eq('id', userCtx.user.id)

  return NextResponse.json({ ok: true, flagged: existingCount >= 1 })
}
