import { NextRequest, NextResponse } from 'next/server'
import { runDeadlineMonitor } from '@/lib/cron/deadline-monitor'

export async function GET(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await runDeadlineMonitor()
  return NextResponse.json({ ok: true, ...result })
}
