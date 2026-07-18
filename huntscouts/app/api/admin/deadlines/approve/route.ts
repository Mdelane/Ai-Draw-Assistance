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
  const { data: pendingRow } = await admin.from('state_deadlines').select('*').eq('id', rowId).single()
  if (!pendingRow || pendingRow.status !== 'pending_review') {
    return NextResponse.json({ error: 'Row not found or not pending review' }, { status: 404 })
  }

  if (pendingRow.supersedes) {
    await admin.from('state_deadlines').update({ status: 'superseded' }).eq('id', pendingRow.supersedes)
  }

  await admin
    .from('state_deadlines')
    .update({ status: 'verified', verified_at: new Date().toISOString(), verified_by: user.email ?? user.id })
    .eq('id', rowId)

  return NextResponse.json({ ok: true })
}
