import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')
  if (!uid) return new NextResponse('Invalid link', { status: 400 })

  const supabase = await createAdminClient()
  await supabase.from('users').update({ email_unsubscribed: true }).eq('id', uid)

  return new NextResponse(
    `<!DOCTYPE html><html><body style="font-family:system-ui;text-align:center;padding:60px">
      <h2 style="color:#1B4332">You've been unsubscribed</h2>
      <p style="color:#666">You won't receive marketing emails from HuntScouts. Transactional emails (booking confirmations, etc.) will still be sent.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="color:#1B4332">Return to HuntScouts →</a>
    </body></html>`,
    { headers: { 'Content-Type': 'text/html' } }
  )
}
