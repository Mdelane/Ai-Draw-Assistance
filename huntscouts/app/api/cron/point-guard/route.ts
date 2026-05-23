import { NextRequest, NextResponse } from 'next/server'
import { runPointGuardAlerts } from '@/lib/cron/point-guard'

export async function GET(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await runPointGuardAlerts(14)
  return NextResponse.json({ ok: true, alerted: result.alerted })
}
