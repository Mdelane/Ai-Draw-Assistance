import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function updateBookingCapabilities(outfitterId: string) {
  const supabase = await createAdminClient()

  const { data: profile, error } = await supabase
    .from('outfitter_profiles')
    .select('id, completed_bookings_count, wants_instant_booking, users(email, full_name)')
    .eq('id', outfitterId)
    .single()

  if (error || !profile) return

  const newCount = (profile.completed_bookings_count ?? 0) + 1

  await supabase
    .from('outfitter_profiles')
    .update({ completed_bookings_count: newCount })
    .eq('id', outfitterId)

  if (newCount >= 3 && profile.wants_instant_booking) {
    await supabase
      .from('listings')
      .update({ booking_type: 'instant' })
      .eq('outfitter_id', outfitterId)
      .eq('booking_type', 'request')

    const user = (profile as any).users
    if (user?.email) {
      await resend.emails.send({
        from: 'HuntScouts <notifications@huntscouts.com>',
        to: user.email,
        subject: 'Instant booking unlocked on your listings!',
        html: `
          <p>Hi ${user.full_name ?? 'there'},</p>
          <p>Great news — you've completed 3 hunts on HuntScouts. <strong>Instant booking is now unlocked</strong> on all your listings.</p>
          <p>Hunters can now book immediately without waiting for your approval, which typically increases bookings by 30–40%.</p>
          <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/outfitter/listings">View your listings →</a></p>
          <p>— HuntScouts</p>
        `,
      })
    }
  }
}
