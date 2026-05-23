import { createAdminClient } from '@/lib/supabase/server'
import { sendSMS } from '@/lib/sms/send'

export type DeadlineAlert = {
  state: string
  deadlineText: string
  displayNote: string
  deadlineDate: Date | null
  daysUntil: number | null
}

// Parse a text deadline like "April 1" or "February 10" into a Date for the current or next year
export function parseDeadlineDate(deadlineText: string, referenceYear = new Date().getFullYear()): Date | null {
  const parsed = new Date(`${deadlineText} ${referenceYear}`)
  if (isNaN(parsed.getTime())) return null
  // If deadline already passed this year, return next year's date
  if (parsed < new Date()) {
    return new Date(`${deadlineText} ${referenceYear + 1}`)
  }
  return parsed
}

export async function getUpcomingDeadlines(daysAhead = 60): Promise<DeadlineAlert[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('state_regulatory_overrides')
    .select('state, rule_value, display_note')
    .eq('rule_type', 'deadline')
    .is('species', null)

  if (!data) return []

  const now = new Date()
  const cutoff = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  return data
    .map(row => {
      const deadlineDate = parseDeadlineDate(row.rule_value)
      const daysUntil = deadlineDate
        ? Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null
      return {
        state: row.state,
        deadlineText: row.rule_value,
        displayNote: row.display_note ?? row.rule_value,
        deadlineDate,
        daysUntil,
      }
    })
    .filter(d => d.deadlineDate !== null && d.deadlineDate <= cutoff && (d.daysUntil ?? 999) > 0)
    .sort((a, b) => (a.daysUntil ?? 999) - (b.daysUntil ?? 999))
}

// Main cron function — finds users who have points in states with upcoming deadlines and have alert_deadline = true
export async function runPointGuardAlerts(daysBeforeDeadline = 14): Promise<{ alerted: number }> {
  const supabase = await createAdminClient()
  const deadlines = await getUpcomingDeadlines(daysBeforeDeadline)

  if (!deadlines.length) return { alerted: 0 }

  let alerted = 0

  for (const deadline of deadlines) {
    const { data: hunters } = await supabase
      .from('scout_points')
      .select('user_id, state, species, points, scout_profiles!inner(alert_deadline)')
      .eq('state', deadline.state)
      .eq('scout_profiles.alert_deadline', true)

    if (!hunters?.length) continue

    for (const hunter of hunters) {
      const { data: profile } = await supabase
        .from('scout_profiles')
        .select('phone_number, sms_opt_in')
        .eq('user_id', hunter.user_id)
        .single()

      if (profile?.sms_opt_in && profile?.phone_number) {
        const msg = `HuntScouts: ${deadline.state} draw applications close ${deadline.deadlineText}. Don't miss your window. huntscouts.com/scout`
        await sendSMS(profile.phone_number, msg)
        alerted++
      }
    }
  }

  return { alerted }
}
