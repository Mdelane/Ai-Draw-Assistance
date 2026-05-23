import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendNurtureDay3, sendNurtureDay7 } from '@/lib/email'

export async function GET(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createAdminClient()
  const now = new Date()

  const day3Start = new Date(now); day3Start.setDate(day3Start.getDate() - 4)
  const day3End = new Date(now); day3End.setDate(day3End.getDate() - 3)

  const { data: day3Users } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('nurture_stage', 1)
    .eq('email_unsubscribed', false)
    .gte('created_at', day3Start.toISOString())
    .lte('created_at', day3End.toISOString())

  for (const user of day3Users ?? []) {
    await sendNurtureDay3({ to: user.email, name: user.full_name ?? 'Hunter', userId: user.id })
    await supabase.from('users').update({ nurture_stage: 2 }).eq('id', user.id)
  }

  const day7Start = new Date(now); day7Start.setDate(day7Start.getDate() - 8)
  const day7End = new Date(now); day7End.setDate(day7End.getDate() - 7)

  const { data: day7Users } = await supabase
    .from('users')
    .select('id, email, full_name')
    .eq('nurture_stage', 2)
    .eq('email_unsubscribed', false)
    .gte('created_at', day7Start.toISOString())
    .lte('created_at', day7End.toISOString())

  for (const user of day7Users ?? []) {
    await sendNurtureDay7({ to: user.email, name: user.full_name ?? 'Hunter', userId: user.id })
    await supabase.from('users').update({ nurture_stage: 3 }).eq('id', user.id)
  }

  return NextResponse.json({ ok: true, day3: day3Users?.length ?? 0, day7: day7Users?.length ?? 0 })
}
