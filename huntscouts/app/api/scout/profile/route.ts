import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  let userCtx: Awaited<ReturnType<typeof requireUser>>
  try {
    userCtx = await requireUser()
  } catch (res) {
    return res as NextResponse
  }

  const supabase = await createAdminClient()

  const [{ data: profile }, { data: points }] = await Promise.all([
    supabase.from('scout_profiles').select('*').eq('user_id', userCtx.user.id).single(),
    supabase.from('scout_points').select('*').eq('user_id', userCtx.user.id).order('is_primary', { ascending: false }).order('created_at'),
  ])

  return NextResponse.json({ profile: profile ?? null, points: points ?? [] })
}

export async function POST(req: NextRequest) {
  let userCtx: Awaited<ReturnType<typeof requireUser>>
  try {
    userCtx = await requireUser()
  } catch (res) {
    return res as NextResponse
  }

  const { profile, points } = await req.json()
  const supabase = await createAdminClient()

  if (profile) {
    await supabase
      .from('scout_profiles')
      .upsert({ ...profile, user_id: userCtx.user.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
  }

  if (points) {
    // Replace all points for this user
    await supabase.from('scout_points').delete().eq('user_id', userCtx.user.id)
    if (points.length > 0) {
      await supabase.from('scout_points').insert(
        points.map((p: any) => ({ ...p, user_id: userCtx.user.id }))
      )
    }
  }

  // Mark onboarding as no longer dismissed if they completed it
  if (profile?.completed) {
    await supabase
      .from('users')
      .update({ scout_onboarding_dismissed: false })
      .eq('id', userCtx.user.id)
  }

  return NextResponse.json({ ok: true })
}
