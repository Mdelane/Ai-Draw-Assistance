import type { StateDeadlineRow, DeadlineSourceRow } from './types'

const TZ_LABELS: Record<string, string> = {
  'America/Denver': 'MT',
  'America/Phoenix': 'AZ time',
  'America/Los_Angeles': 'PT',
  'America/Boise': 'MT',
}

export function classifyRenderState(row: StateDeadlineRow, today: Date): 'verified' | 'passed' {
  const eventDate = new Date(`${row.event_date}T23:59:59Z`)
  return eventDate < today ? 'passed' : 'verified'
}

export function formatTimeZoneLabel(eventTime: string | null, timezone: string): string {
  if (!eventTime) return ''
  const [hourStr, minuteStr] = eventTime.split(':')
  const hour24 = parseInt(hourStr, 10)
  const minute = parseInt(minuteStr, 10)
  const period = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12
  const timeStr = minute === 0 ? `${hour12} ${period}` : `${hour12}:${String(minute).padStart(2, '0')} ${period}`
  const tzLabel = TZ_LABELS[timezone] ?? timezone
  return `${timeStr} ${tzLabel}`
}

export function isStale(verifiedAt: string | null): boolean {
  if (!verifiedAt) return true
  const verifiedDate = new Date(verifiedAt)
  const ageMs = Date.now() - verifiedDate.getTime()
  const FOUR_HUNDRED_DAYS_MS = 400 * 24 * 60 * 60 * 1000
  return ageMs > FOUR_HUNDRED_DAYS_MS
}

export function getVerificationTasksForMonth(
  sources: DeadlineSourceRow[],
  month: number,
  targetYear: number
): { state: string; agencyName: string; canonicalUrl: string; taskLabel: string }[] {
  return sources
    .filter((s) => s.publication_month === month && s.monitor_enabled)
    .map((s) => ({
      state: s.state,
      agencyName: s.agency_name,
      canonicalUrl: s.canonical_url,
      taskLabel: `Verify ${s.state} ${targetYear} deadlines`,
    }))
}
