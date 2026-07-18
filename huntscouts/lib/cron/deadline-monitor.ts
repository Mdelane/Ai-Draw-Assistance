import crypto from 'crypto'
import Anthropic from '@anthropic-ai/sdk'
import { createAdminClient } from '@/lib/supabase/server'
import { sendDeadlineChangeDetected } from '@/lib/email'
import type { DeadlineSourceRow, StateDeadlineRow } from '@/lib/deadlines/types'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export function shouldCheckToday(source: DeadlineSourceRow, today: Date, upcomingCloseDates: Date[]): boolean {
  if (!source.monitor_enabled) return false
  const month = today.getUTCMonth() // 0-indexed: 0=Jan .. 5=Jun
  if (month <= 5) return true // Jan-Jun: daily
  const isMonday = today.getUTCDay() === 1
  if (isMonday) return true // Jul-Dec: weekly
  const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000
  return upcomingCloseDates.some((d) => Math.abs(d.getTime() - today.getTime()) <= THIRTY_DAYS_MS && d.getTime() >= today.getTime())
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function hashContent(text: string): string {
  return crypto.createHash('sha256').update(text).digest('hex')
}

interface ExtractionResult {
  rows: { id: string; classification: 'unchanged' | 'changed' | 'not_found'; new_event_date?: string; new_event_time?: string | null }[]
  new_events: { deadline_type: string; species: string[]; residency: string; event_date: string; event_time: string | null; display_label: string; notes: string }[]
}

async function extractChanges(state: string, currentRows: StateDeadlineRow[], pageText: string): Promise<ExtractionResult> {
  const rowSummaries = currentRows.map((r) => ({
    id: r.id,
    deadline_type: r.deadline_type,
    species: r.species,
    residency: r.residency,
    event_date: r.event_date,
    event_time: r.event_time,
  }))

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 4096,
    output_config: {
      format: {
        type: 'json_schema',
        schema: {
          type: 'object',
          properties: {
            rows: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  classification: { type: 'string', enum: ['unchanged', 'changed', 'not_found'] },
                  new_event_date: { type: 'string' },
                  new_event_time: { type: 'string' },
                },
                required: ['id', 'classification'],
                additionalProperties: false,
              },
            },
            new_events: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  deadline_type: { type: 'string' },
                  species: { type: 'array', items: { type: 'string' } },
                  residency: { type: 'string' },
                  event_date: { type: 'string' },
                  event_time: { type: 'string' },
                  display_label: { type: 'string' },
                  notes: { type: 'string' },
                },
                required: ['deadline_type', 'species', 'residency', 'event_date', 'display_label', 'notes'],
                additionalProperties: false,
              },
            },
          },
          required: ['rows', 'new_events'],
          additionalProperties: false,
        },
      },
    },
    messages: [
      {
        role: 'user',
        content: `Here are the deadline dates Hunt Atlas currently has verified for ${state}: ${JSON.stringify(rowSummaries)}.

Here is the current text content of ${state}'s agency deadline page:

${pageText.slice(0, 15000)}

For each of our current rows, classify it as "unchanged" (still matches the page), "changed" (the page shows a different date for the same event — include new_event_date and new_event_time), or "not_found" (the page no longer mentions this event). Also list any NEW deadline events on the page that aren't in our current rows. Only report events with clear, explicit dates — do not guess or infer a date that isn't stated.`,
      },
    ],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') return { rows: [], new_events: [] }
  return JSON.parse(textBlock.text) as ExtractionResult
}

export async function runDeadlineMonitor(): Promise<{ checked: number; changed: number }> {
  const supabase = await createAdminClient()
  const { data: sources } = await supabase.from('deadline_sources').select('*')
  if (!sources) return { checked: 0, changed: 0 }

  const today = new Date()
  const currentYear = today.getFullYear()

  const { data: closeDeadlineRows } = await supabase
    .from('state_deadlines')
    .select('state, event_date')
    .eq('deadline_type', 'application_close')
    .eq('status', 'verified')
    .gte('year', currentYear)

  let checked = 0
  let changed = 0

  for (const source of sources as DeadlineSourceRow[]) {
    const stateCloseDates = (closeDeadlineRows ?? [])
      .filter((r) => r.state === source.state)
      .map((r) => new Date(r.event_date))

    if (!shouldCheckToday(source, today, stateCloseDates)) continue

    let pageText: string
    try {
      const res = await fetch(source.canonical_url, { headers: { 'User-Agent': 'HuntScoutsDeadlineMonitor/1.0' } })
      const html = await res.text()
      pageText = stripHtml(html)
    } catch {
      continue // network/fetch failure — skip this source this cycle, don't touch last_checked_at
    }

    checked++
    const hash = hashContent(pageText)

    if (hash === source.last_content_hash) {
      await supabase.from('deadline_sources').update({ last_checked_at: new Date().toISOString() }).eq('id', source.id)
      continue
    }

    const { data: currentRows } = await supabase
      .from('state_deadlines')
      .select('*')
      .eq('state', source.state)
      .eq('status', 'verified')
      .gte('year', currentYear)

    const extraction = await extractChanges(source.state, (currentRows ?? []) as StateDeadlineRow[], pageText)

    let pendingCount = 0
    for (const classified of extraction.rows) {
      if (classified.classification !== 'changed' || !classified.new_event_date) continue
      const oldRow = (currentRows ?? []).find((r) => r.id === classified.id) as StateDeadlineRow | undefined
      if (!oldRow) continue
      await supabase.from('state_deadlines').insert({
        state: oldRow.state,
        year: oldRow.year,
        species: oldRow.species,
        residency: oldRow.residency,
        deadline_type: oldRow.deadline_type,
        event_date: classified.new_event_date,
        event_time: classified.new_event_time ?? oldRow.event_time,
        timezone: oldRow.timezone,
        status: 'pending_review',
        source_url: source.canonical_url,
        supersedes: oldRow.id,
        display_label: oldRow.display_label,
        notes: `Monitor detected a date change from ${oldRow.event_date} on ${new Date().toISOString().slice(0, 10)}.`,
      })
      pendingCount++
    }

    for (const newEvent of extraction.new_events) {
      await supabase.from('state_deadlines').insert({
        state: source.state,
        year: currentYear,
        species: newEvent.species,
        residency: newEvent.residency,
        deadline_type: newEvent.deadline_type,
        event_date: newEvent.event_date,
        event_time: newEvent.event_time ?? null,
        timezone: 'America/Denver',
        status: 'pending_review',
        source_url: source.canonical_url,
        display_label: newEvent.display_label,
        notes: `Monitor found a new event not previously tracked: ${newEvent.notes}`,
      })
      pendingCount++
    }

    await supabase
      .from('deadline_sources')
      .update({ last_checked_at: new Date().toISOString(), last_content_hash: hash })
      .eq('id', source.id)

    if (pendingCount > 0) {
      changed++
      const { data: admins } = await supabase.from('users').select('email').eq('role', 'admin')
      for (const admin of admins ?? []) {
        if (admin.email) {
          await sendDeadlineChangeDetected({
            adminEmail: admin.email,
            state: source.state,
            agencyName: source.agency_name,
            pendingCount,
          })
        }
      }
    }
  }

  return { checked, changed }
}
