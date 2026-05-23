import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { sendWelcomeEmail } from '@/lib/email'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST() {
  let userCtx: Awaited<ReturnType<typeof requireUser>>
  try { userCtx = await requireUser() } catch (res) { return res as NextResponse }

  const supabase = await createAdminClient()
  const { data: userRow } = await supabase
    .from('users')
    .select('full_name, email_unsubscribed, nurture_stage')
    .eq('id', userCtx.user.id)
    .single()

  if (!userRow || userRow.email_unsubscribed || userRow.nurture_stage > 0) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  await sendWelcomeEmail({
    to: userCtx.user.email!,
    name: userRow.full_name ?? 'Hunter',
    userId: userCtx.user.id,
  })

  await supabase.from('users').update({ nurture_stage: 1 }).eq('id', userCtx.user.id)

  return NextResponse.json({ ok: true })
}
