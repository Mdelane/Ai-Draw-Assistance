import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST() {
  let userCtx: Awaited<ReturnType<typeof requireUser>>
  try {
    userCtx = await requireUser()
  } catch (res) {
    return res as NextResponse
  }

  const supabase = await createAdminClient()
  await supabase.from('users').update({ scout_onboarding_dismissed: true }).eq('id', userCtx.user.id)

  return NextResponse.json({ ok: true })
}
