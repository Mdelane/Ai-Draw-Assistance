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

  if (userCtx.profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { outfitter_id } = await req.json()
  const supabase = await createAdminClient()

  const { error } = await supabase
    .from('outfitter_profiles')
    .update({ license_verified: true })
    .eq('id', outfitter_id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
