import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: self } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (self?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { rowId } = await req.json()
  if (!rowId) return NextResponse.json({ error: 'rowId required' }, { status: 400 })

  const admin = await createAdminClient()
  const { error } = await admin.from('state_deadlines').delete().eq('id', rowId).eq('status', 'pending_review')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
