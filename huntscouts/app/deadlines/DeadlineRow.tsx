import { classifyRenderState, formatTimeZoneLabel } from '@/lib/deadlines/render'
import type { StateDeadlineRow } from '@/lib/deadlines/types'

const TYPE_LABELS: Record<string, string> = {
  application_open: 'Applications Open',
  application_close: 'Application Deadline',
  modification_deadline: 'Modification Deadline',
  results_posted: 'Results Posted',
  tag_surrender_deadline: 'Tag Surrender Deadline',
  secondary_draw_open: 'Secondary Draw Opens',
  secondary_draw_close: 'Secondary Draw Deadline',
  secondary_results_posted: 'Secondary Results Posted',
  leftover_fcfs_start: 'Leftover (First-Come) Sales Begin',
  points_only_open: 'Points-Only Window Opens',
  points_only_close: 'Points-Only Window Closes',
  otc_sale_start: 'Over-the-Counter Sales Begin',
}

export default function DeadlineRow({ row, agencyAbbr }: { row: StateDeadlineRow; agencyAbbr: string }) {
  const renderState = classifyRenderState(row, new Date())
  const timeLabel = formatTimeZoneLabel(row.event_time, row.timezone)
  const dateLabel = new Date(`${row.event_date}T00:00:00`).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const label = row.display_label ?? TYPE_LABELS[row.deadline_type] ?? row.deadline_type

  if (row.status === 'pending_publication') {
    return (
      <div className="py-3 px-4 border-b border-stone-100 last:border-b-0">
        <div className="flex items-baseline justify-between gap-4">
          <span className="text-sm font-medium text-gray-900">{label}</span>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full whitespace-nowrap">
            Pending confirmation
          </span>
        </div>
        <p className="text-xs text-stone-500 mt-1">
          This date is being confirmed against the agency source and hasn&rsquo;t been published yet.
        </p>
        <a
          href={row.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-stone-400 hover:underline mt-1 inline-block"
        >
          See source →
        </a>
      </div>
    )
  }

  if (renderState === 'passed') {
    return (
      <div className="flex items-center justify-between py-3 px-4 opacity-50">
        <span className="text-sm text-stone-500">{label}</span>
        <span className="text-xs font-bold uppercase tracking-widest text-stone-400 bg-stone-100 px-2 py-0.5 rounded-full">Closed</span>
      </div>
    )
  }

  return (
    <div className="py-3 px-4 border-b border-stone-100 last:border-b-0">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-gray-900">{label}</span>
        <span className="text-sm font-black text-gray-900 whitespace-nowrap">
          {dateLabel}{timeLabel ? ` · ${timeLabel}` : ''}
        </span>
      </div>
      <a
        href={row.source_url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-green-700 hover:underline mt-1 inline-block"
      >
        ✓ Verified from {agencyAbbr}{row.verified_at ? ` · ${new Date(row.verified_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : ''}
      </a>
    </div>
  )
}
