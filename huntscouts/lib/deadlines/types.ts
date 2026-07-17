export type DeadlineType =
  | 'application_open'
  | 'application_close'
  | 'modification_deadline'
  | 'results_posted'
  | 'tag_surrender_deadline'
  | 'secondary_draw_open'
  | 'secondary_draw_close'
  | 'secondary_results_posted'
  | 'leftover_fcfs_start'
  | 'points_only_open'
  | 'points_only_close'
  | 'otc_sale_start'

export type DeadlineStatus = 'verified' | 'pending_publication' | 'pending_review' | 'superseded'

export interface StateDeadlineRow {
  id: string
  state: string
  year: number
  species: string[]
  residency: string
  deadline_type: DeadlineType
  event_date: string
  event_time: string | null
  timezone: string
  status: DeadlineStatus
  source_url: string
  verified_at: string | null
  verified_by: string | null
  supersedes: string | null
  display_label: string | null
  notes: string | null
}

export interface DeadlineSourceRow {
  id: string
  state: string
  agency_name: string
  agency_abbr: string
  canonical_url: string
  secondary_urls: string[]
  publication_window: string
  publication_month: number
  monitor_enabled: boolean
  last_checked_at: string | null
  last_content_hash: string | null
  notes: string | null
}
