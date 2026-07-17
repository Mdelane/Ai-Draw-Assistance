import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { StateDeadlineRow, DeadlineSourceRow } from './types'

export async function getAllSources(): Promise<DeadlineSourceRow[]> {
  const supabase = await createClient()
  const { data } = await supabase.from('deadline_sources').select('*').order('state')
  return (data ?? []) as DeadlineSourceRow[]
}

export async function getPublicDeadlines(): Promise<{ sources: DeadlineSourceRow[]; deadlines: StateDeadlineRow[] }> {
  const supabase = await createClient()
  const currentYear = new Date().getFullYear()

  const [{ data: sources }, { data: deadlines }] = await Promise.all([
    supabase.from('deadline_sources').select('*').order('state'),
    supabase
      .from('state_deadlines')
      .select('*')
      .in('status', ['verified', 'pending_publication'])
      .gte('year', currentYear)
      .order('state')
      .order('event_date'),
  ])

  return {
    sources: (sources ?? []) as DeadlineSourceRow[],
    deadlines: (deadlines ?? []) as StateDeadlineRow[],
  }
}

export async function getAllDeadlinesAdmin(year: number): Promise<StateDeadlineRow[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('state_deadlines')
    .select('*')
    .eq('year', year)
    .order('state')
    .order('deadline_type')
  return (data ?? []) as StateDeadlineRow[]
}

export async function getPendingReviewRows(): Promise<StateDeadlineRow[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('state_deadlines')
    .select('*')
    .eq('status', 'pending_review')
    .order('state')
  return (data ?? []) as StateDeadlineRow[]
}

export async function getPendingPublicationRows(): Promise<StateDeadlineRow[]> {
  const supabase = await createAdminClient()
  const { data } = await supabase
    .from('state_deadlines')
    .select('*')
    .eq('status', 'pending_publication')
    .order('state')
  return (data ?? []) as StateDeadlineRow[]
}
