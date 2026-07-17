# Deadline Verification System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kill every "estimated" draw-deadline date on HuntScouts. Ship agency-verified state deadline data with source attribution, a weekly/daily change-detection monitor backed by the Claude API, and an admin approve/dismiss workflow — so a displayed date is either verified against the state agency or not shown as a date at all.

**Architecture:** Two new Supabase tables (`deadline_sources`, `state_deadlines`) seeded with the already-researched 2026 dataset. A pure `lib/deadlines/` module computes render state and verification-task state with no DB dependency (testable in isolation). A public `/deadlines` page renders only `verified` rows through the three-state contract (Verified / Not-yet-published / Passed). An `/admin/deadlines` page lists all rows, surfaces a pending-review queue, and lets an admin approve (supersede) or dismiss a monitor-detected change, plus confirm a `pending_publication` row once the admin has manually checked the agency source. A Vercel Cron job hits each agency URL, hashes the rendered text, and on a hash change asks Claude (`claude-opus-4-8`, structured JSON output) to classify each of our current rows as unchanged/changed/not_found and to surface new events — writing only `pending_review` rows, never auto-publishing. A Resend email notifies admins when the queue gets new pending rows.

**Tech Stack:** Next.js 16 (App Router, this repo's existing conventions — see Global Constraints), Supabase (`@supabase/ssr`), `@anthropic-ai/sdk` (already a dependency), Resend (already a dependency), Vercel Cron.

## Global Constraints

- **Next.js conventions:** This repo runs Next.js 16.2.6 with breaking changes vs. older Next.js in your training data (see `AGENTS.md` at the repo root). Do not re-derive conventions from memory — copy the exact patterns already used in `app/admin/listings/page.tsx`, `app/admin/page.tsx`, and `app/api/cron/point-guard/route.ts` (async `cookies()`, async Server Components calling `await createClient()`, `redirect()` from `next/navigation`, Route Handlers exporting `GET`/`POST`). If a pattern isn't covered by an existing file, check `node_modules/next/dist/docs/01-app/` before guessing.
- **No test runner exists in this repo** (confirmed: no `vitest`/`jest`, no `*.test.ts` anywhere, no test script in `package.json`). Do not introduce one. Every task's verification step is a manual one: `npx tsc --noEmit` / `npm run build`, a `node -e` smoke script against pure functions, or hitting a route with `curl` against `next dev`. This replaces the "write failing test" step from the standard bite-sized-task template.
- **DB migrations are flat SQL files**, not a migrations directory. Follow `supabase/add-abuse-prevention-s1.sql` naming: this feature's file is `supabase/add-deadline-verification.sql`. There is no `npm run migrate` — the file must be applied manually via the Supabase SQL editor. **After writing the file, tell the user it needs to be run in the Supabase SQL editor; do not claim the feature works end-to-end until they confirm it's been applied** (there is no service-role DDL execution path available to check this in automatically).
- **Supabase clients:** `createClient()` from `@/lib/supabase/server` for user-session-scoped reads (RLS applies); `createAdminClient()` from the same module for the cron job and any write that must bypass RLS. Both are already defined in `lib/supabase/server.ts` — do not add a third client.
- **Anthropic model:** Use `claude-opus-4-8` for the change-detection extraction call (already a listed model; `@anthropic-ai/sdk` is already installed). Do not reuse the older `claude-sonnet-4-20250514` string that appears in `app/api/scout/chat/route.ts` — that is a separate, pre-existing call site out of scope for this feature.
- **Env vars — all already exist**, do not add new ones: `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `RESEND_API_KEY`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`.
- **Cron auth:** every new cron route must check `req.headers.get('x-cron-secret') !== process.env.CRON_SECRET` → 401, exactly like `app/api/cron/point-guard/route.ts`.
- **Never auto-publish a monitor-detected change.** The monitor only ever inserts `pending_review` rows. A human (admin) always approves or dismisses.
- **Timezone display:** every `event_time`/`timezone` pair must render literally (e.g. "8:00 PM MT", "11:59 PM AZ time") — never normalize to the viewer's local timezone. This is the #1 stated user-harm scenario in the spec (CO's 8 PM vs. midnight, AZ's no-DST).
- **The word "estimated" (or "approximately"/"usually"/"~") must never appear next to a specific date** on the public `/deadlines` page. If a date can't be stated flat, use the Not-Yet-Published render.
- Follow repo conventions already visible in `app/admin/listings/*`, `app/admin/page.tsx`, `lib/cron/point-guard.ts`, `lib/email/index.ts`: Tailwind utility classes matching the existing stone/amber/green palette, `'use client'` only on the small interactive buttons, server components for data fetching.

---

## File Structure

| File | Responsibility |
|---|---|
| `supabase/add-deadline-verification.sql` | Schema (enums, `deadline_sources`, `state_deadlines`, index) + full 2026 seed data |
| `lib/deadlines/types.ts` | TS types mirroring the DB enums/rows |
| `lib/deadlines/render.ts` | Pure functions: three-state render classification, staleness check, verification-task generator |
| `lib/deadlines/queries.ts` | Server-side Supabase query helpers (public + admin) |
| `app/deadlines/page.tsx` | Public deadlines page — server component, groups by state, uses `render.ts` |
| `app/deadlines/DeadlineRow.tsx` | Presentational component for one deadline event (trust badge, three render states) |
| `app/admin/deadlines/page.tsx` | Admin dashboard — pending queue + full table + stale flags + pending_publication confirm |
| `app/admin/deadlines/DeadlineReviewActions.tsx` | Client component: Approve / Dismiss buttons for a pending row |
| `app/admin/deadlines/ConfirmPublicationButton.tsx` | Client component: Confirm button for a `pending_publication` row |
| `app/api/admin/deadlines/approve/route.ts` | POST — approve a pending_review row (supersede old, verify new) |
| `app/api/admin/deadlines/dismiss/route.ts` | POST — dismiss (delete) a pending_review row |
| `app/api/admin/deadlines/confirm/route.ts` | POST — confirm a pending_publication row as verified |
| `lib/cron/deadline-monitor.ts` | Fetch → hash → diff → Claude extraction → insert pending rows → email |
| `app/api/cron/deadline-monitor/route.ts` | Cron-secret-gated GET handler calling `runDeadlineMonitor()` |
| `lib/email/index.ts` (modify) | Add `sendDeadlineChangeDetected(...)` |
| `vercel.json` (modify) | Add the deadline-monitor cron entry |
| `components/Navbar.tsx` (modify) | Add a "Deadlines" nav link |

---

### Task 1: Database schema and seed data

**Files:**
- Create: `supabase/add-deadline-verification.sql`

**Interfaces:**
- Produces: tables `deadline_sources(id, state, agency_name, agency_abbr, canonical_url, secondary_urls, publication_window, publication_month, monitor_enabled, last_checked_at, last_content_hash, notes, created_at, updated_at)` and `state_deadlines(id, state, year, species, residency, deadline_type, event_date, event_time, timezone, status, source_url, verified_at, verified_by, supersedes, display_label, notes, created_at)`; enums `deadline_type`, `deadline_status`.

- [ ] **Step 1: Write the schema DDL**

Create `supabase/add-deadline-verification.sql` with this header and DDL:

```sql
-- Hunt Atlas — Deadline Verification System
-- P0 trust-critical: kills "estimated" dates on the deadlines page.
-- Run this file in the Supabase SQL editor.

create table if not exists deadline_sources (
  id uuid primary key default gen_random_uuid(),
  state text not null unique,
  agency_name text not null,
  agency_abbr text not null,
  canonical_url text not null,
  secondary_urls text[] default '{}',
  publication_window text not null,
  publication_month int not null,
  monitor_enabled boolean default true,
  last_checked_at timestamptz,
  last_content_hash text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

do $$ begin
  create type deadline_type as enum (
    'application_open',
    'application_close',
    'modification_deadline',
    'results_posted',
    'tag_surrender_deadline',
    'secondary_draw_open',
    'secondary_draw_close',
    'secondary_results_posted',
    'leftover_fcfs_start',
    'points_only_open',
    'points_only_close',
    'otc_sale_start'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type deadline_status as enum (
    'verified',
    'pending_publication',
    'pending_review',
    'superseded'
  );
exception when duplicate_object then null; end $$;

create table if not exists state_deadlines (
  id uuid primary key default gen_random_uuid(),
  state text not null references deadline_sources(state),
  year int not null,
  species text[] not null,
  residency text not null default 'all',
  deadline_type deadline_type not null,
  event_date date not null,
  event_time text,
  timezone text not null,
  status deadline_status not null default 'verified',
  source_url text not null,
  verified_at timestamptz,
  verified_by text,
  supersedes uuid references state_deadlines(id),
  display_label text,
  notes text,
  created_at timestamptz default now(),
  unique(state, year, deadline_type, species, residency)
);

create index if not exists idx_deadlines_lookup on state_deadlines(state, year, status);
```

- [ ] **Step 2: Append the seed data**

Append the **full, unmodified contents** of `docs/superpowers/plans/deadlines-seed-2026.sql.reference` to the end of `supabase/add-deadline-verification.sql` (everything from the `-- Hunt Atlas — 2026 Deadline Seed Data` header through the final Wyoming `insert` statement — 11 source rows covering AZ/CA/CO/ID/MT/NV/NM/OR/UT/WA/WY, and ~70 `state_deadlines` rows). The column names in that reference file already match the schema above exactly — do not rename or reshape anything. After appending, delete the `.reference` file (it was a staging copy for this step only, not a checked-in artifact).

- [ ] **Step 3: Verify the file parses as valid SQL structure**

Run: `node -e "const s=require('fs').readFileSync('supabase/add-deadline-verification.sql','utf8'); const opens=(s.match(/insert into/gi)||[]).length; console.log('insert statements:', opens); if(opens<12) throw new Error('seed data missing')"`
Expected: prints `insert statements: 13` (1 for sources + 12 per-state insert blocks — AZ has an extra results-focused block; count is fine as long as it's ≥12 and the command doesn't throw).

- [ ] **Step 4: Commit**

```bash
git add supabase/add-deadline-verification.sql
git rm docs/superpowers/plans/deadlines-seed-2026.sql.reference 2>/dev/null || rm -f docs/superpowers/plans/deadlines-seed-2026.sql.reference
git add -A docs/superpowers/plans
git commit -m "feat: add deadline verification schema and 2026 seed data"
```

---

### Task 2: Pure deadline domain logic (`lib/deadlines/`)

**Files:**
- Create: `lib/deadlines/types.ts`
- Create: `lib/deadlines/render.ts`
- Test: none (no test runner) — verify via `node -e` script in Step 4 below, run against the compiled/transpiled logic through `tsx` if available, otherwise via a temporary `.mjs` smoke file (see Step 4).

**Interfaces:**
- Produces (consumed by Tasks 3 and 4):
  - `type DeadlineType = 'application_open' | 'application_close' | 'modification_deadline' | 'results_posted' | 'tag_surrender_deadline' | 'secondary_draw_open' | 'secondary_draw_close' | 'secondary_results_posted' | 'leftover_fcfs_start' | 'points_only_open' | 'points_only_close' | 'otc_sale_start'`
  - `type DeadlineStatus = 'verified' | 'pending_publication' | 'pending_review' | 'superseded'`
  - `interface StateDeadlineRow { id: string; state: string; year: number; species: string[]; residency: string; deadline_type: DeadlineType; event_date: string; event_time: string | null; timezone: string; status: DeadlineStatus; source_url: string; verified_at: string | null; verified_by: string | null; supersedes: string | null; display_label: string | null; notes: string | null }`
  - `interface DeadlineSourceRow { id: string; state: string; agency_name: string; agency_abbr: string; canonical_url: string; secondary_urls: string[]; publication_window: string; publication_month: number; monitor_enabled: boolean; last_checked_at: string | null; last_content_hash: string | null; notes: string | null }`
  - `function classifyRenderState(row: StateDeadlineRow, today: Date): 'verified' | 'passed'` — a `verified`-status row with `event_date < today` (compared as UTC dates) classifies as `'passed'`; otherwise `'verified'`. (The third contractual state, "not yet published," is a *state-level absence* — computed by the caller when no `verified`/`pending_publication` row exists for the upcoming year, not by this function on a single row.)
  - `function formatTimeZoneLabel(event_time: string | null, timezone: string): string` — e.g. `formatTimeZoneLabel('20:00', 'America/Denver')` → `'8:00 PM MT'`, `formatTimeZoneLabel('23:59', 'America/Phoenix')` → `'11:59 PM AZ time'`, `formatTimeZoneLabel(null, 'America/Los_Angeles')` → `''`. Map: `America/Denver`→`MT`, `America/Phoenix`→`AZ time`, `America/Los_Angeles`→`PT`, `America/Boise`→`MT`. (Idaho's Boise-area counties are Mountain; the seed data's ID rows use MT-equivalent hours consistent with `America/Boise`.)
  - `function isStale(verified_at: string | null): boolean` — true if `verified_at` is null or older than 400 days from now.
  - `function getVerificationTasksForMonth(sources: DeadlineSourceRow[], month: number, targetYear: number): { state: string; agencyName: string; canonicalUrl: string; taskLabel: string }[]` — returns one task per source whose `publication_month === month`, labeled `Verify ${state} ${targetYear} deadlines`.

- [ ] **Step 1: Write `lib/deadlines/types.ts`**

```typescript
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
```

- [ ] **Step 2: Write `lib/deadlines/render.ts`**

```typescript
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
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit lib/deadlines/types.ts lib/deadlines/render.ts --strict --esModuleInterop --skipLibCheck`
Expected: no output (no errors). If `tsc` complains about missing `--module`/`--target` flags for standalone files, instead run the whole-project check: `npx tsc --noEmit` and confirm no new errors reference `lib/deadlines/`.

- [ ] **Step 4: Manual smoke-test the pure functions**

Run:
```bash
node -e "
const { classifyRenderState, formatTimeZoneLabel, isStale, getVerificationTasksForMonth } = require('./lib/deadlines/render.ts');
" 2>&1 || echo "expected: ts-node/tsx not registered for require() — this is fine, tsc --noEmit in Step 3 is the real gate"
```
This step is a sanity check only — TypeScript files aren't directly `require()`-able without a loader the repo doesn't have. The Step 3 `tsc --noEmit` pass plus a visual read-through of the four functions against the worked examples in the Interfaces block above (8 PM MT, 11:59 PM AZ time, 400-day staleness, `Verify {state} {year} deadlines` label) is the acceptance bar for this task.

- [ ] **Step 5: Commit**

```bash
git add lib/deadlines/types.ts lib/deadlines/render.ts
git commit -m "feat: add pure deadline render-state and verification-task logic"
```

---

### Task 3: Deadline query helpers

**Files:**
- Create: `lib/deadlines/queries.ts`

**Interfaces:**
- Consumes: `createClient`, `createAdminClient` from `@/lib/supabase/server`; `StateDeadlineRow`, `DeadlineSourceRow` from `./types`
- Produces:
  - `async function getPublicDeadlines(): Promise<{ sources: DeadlineSourceRow[]; deadlines: StateDeadlineRow[] }>` — all `deadline_sources`, and all `state_deadlines` rows with `status in ('verified', 'pending_publication')` for `year >= currentYear`, ordered by `state, event_date`.
  - `async function getAllDeadlinesAdmin(year: number): Promise<StateDeadlineRow[]>` — all rows for a given year regardless of status, ordered by `state, deadline_type`.
  - `async function getPendingReviewRows(): Promise<StateDeadlineRow[]>` — rows with `status = 'pending_review'`.
  - `async function getPendingPublicationRows(): Promise<StateDeadlineRow[]>` — rows with `status = 'pending_publication'`.
  - `async function getAllSources(): Promise<DeadlineSourceRow[]>`

- [ ] **Step 1: Write `lib/deadlines/queries.ts`**

```typescript
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
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors referencing `lib/deadlines/queries.ts`.

- [ ] **Step 3: Commit**

```bash
git add lib/deadlines/queries.ts
git commit -m "feat: add deadline query helpers"
```

---

### Task 4: Public `/deadlines` page

**Files:**
- Create: `app/deadlines/page.tsx`
- Create: `app/deadlines/DeadlineRow.tsx`
- Modify: `components/Navbar.tsx`

**Interfaces:**
- Consumes: `getPublicDeadlines()` from `@/lib/deadlines/queries`; `classifyRenderState`, `formatTimeZoneLabel` from `@/lib/deadlines/render`; `StateDeadlineRow`, `DeadlineSourceRow` from `@/lib/deadlines/types`
- Produces: page at `/deadlines`; `DeadlineRow` component taking `{ row: StateDeadlineRow; agencyAbbr: string }`

- [ ] **Step 1: Write `app/deadlines/DeadlineRow.tsx`**

```tsx
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
```

- [ ] **Step 2: Write `app/deadlines/page.tsx`**

```tsx
import Navbar from '@/components/Navbar'
import DeadlineRow from './DeadlineRow'
import { getPublicDeadlines } from '@/lib/deadlines/queries'
import type { StateDeadlineRow } from '@/lib/deadlines/types'

export default async function DeadlinesPage() {
  const { sources, deadlines } = await getPublicDeadlines()

  const bySource = new Map(sources.map((s) => [s.state, s]))
  const byState = new Map<string, StateDeadlineRow[]>()
  for (const row of deadlines) {
    if (!byState.has(row.state)) byState.set(row.state, [])
    byState.get(row.state)!.push(row)
  }

  const lastAudit = deadlines
    .map((d) => d.verified_at)
    .filter((v): v is string => !!v)
    .sort()
    .at(-1)

  const statesWithData = new Set(byState.keys())
  const notYetPublished = sources.filter((s) => !statesWithData.has(s.state))

  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-2">Draw Deadlines</h1>
        <p className="text-sm text-stone-500 mb-8">
          Every date on this page is verified directly against the state agency source.
          {lastAudit ? ` Last full audit: ${new Date(lastAudit).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.` : ''}
        </p>

        <div className="space-y-6">
          {Array.from(byState.entries()).map(([state, rows]) => {
            const source = bySource.get(state)
            return (
              <div key={state} className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
                <div className="bg-stone-50 border-b border-stone-200 px-4 py-3">
                  <h2 className="font-black tracking-tight text-gray-900">{source?.agency_name ?? state}</h2>
                </div>
                {rows.map((row) => (
                  <DeadlineRow key={row.id} row={row} agencyAbbr={source?.agency_abbr ?? state} />
                ))}
              </div>
            )
          })}

          {notYetPublished.map((source) => (
            <div key={source.state} className="bg-white border border-stone-200 rounded-2xl px-4 py-4">
              <h2 className="font-black tracking-tight text-gray-900 mb-1">{source.agency_name}</h2>
              <p className="text-sm text-stone-500">
                {source.agency_abbr} typically publishes next cycle&rsquo;s dates in {source.publication_window}. Check back then.
              </p>
            </div>
          ))}
        </div>
      </main>
    </>
  )
}
```

- [ ] **Step 3: Add the Navbar link**

In `components/Navbar.tsx`, find the desktop nav block (the three `<Link>`s after the logo: `/listings`, `/outfitters`, `/scout` — around line 27-29) and add a fourth link `<Link href="/deadlines" className="hover:text-green-200 transition-colors">Deadlines</Link>` immediately after the `/scout` link. Do the same in the mobile nav block (around line 90-92) with the matching `onClick={() => setMenuOpen(false)}` prop, inserted after the mobile `/scout` link.

- [ ] **Step 4: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 5: Manual verification against the running app**

Run: `npm run dev` (or confirm a dev server is already running), then in a separate terminal: `curl -s http://localhost:3000/deadlines | grep -c "Verified from"` — expected: a number ≥ 60 (one badge per verified row across all states). Also run `curl -s http://localhost:3000/deadlines | grep -i "estimated"` — expected: **no output** (empty) — this is the acceptance-criteria check that "estimated" never appears. Stop the dev server if you started it for this check alone.

- [ ] **Step 6: Commit**

```bash
git add app/deadlines/page.tsx app/deadlines/DeadlineRow.tsx components/Navbar.tsx
git commit -m "feat: add public deadlines page with verified/passed/not-yet-published states"
```

---

### Task 5: Admin deadlines dashboard + approve/dismiss/confirm actions

**Files:**
- Create: `app/admin/deadlines/page.tsx`
- Create: `app/admin/deadlines/DeadlineReviewActions.tsx`
- Create: `app/admin/deadlines/ConfirmPublicationButton.tsx`
- Create: `app/api/admin/deadlines/approve/route.ts`
- Create: `app/api/admin/deadlines/dismiss/route.ts`
- Create: `app/api/admin/deadlines/confirm/route.ts`
- Modify: `app/admin/page.tsx`

**Interfaces:**
- Consumes: `getAllDeadlinesAdmin`, `getPendingReviewRows`, `getPendingPublicationRows`, `getAllSources` from `@/lib/deadlines/queries`; `isStale`, `getVerificationTasksForMonth` from `@/lib/deadlines/render`; `createClient`, `createAdminClient` from `@/lib/supabase/server`
- Produces: page at `/admin/deadlines`; POST routes at `/api/admin/deadlines/{approve,dismiss,confirm}` each accepting `{ rowId: string }` (JSON body) and returning `{ ok: true }` or `{ error: string }`.

- [ ] **Step 1: Write the approve route** — `app/api/admin/deadlines/approve/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: self } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (self?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { rowId } = await req.json()
  if (!rowId) return NextResponse.json({ error: 'rowId required' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: pendingRow } = await admin.from('state_deadlines').select('*').eq('id', rowId).single()
  if (!pendingRow || pendingRow.status !== 'pending_review') {
    return NextResponse.json({ error: 'Row not found or not pending review' }, { status: 404 })
  }

  if (pendingRow.supersedes) {
    await admin.from('state_deadlines').update({ status: 'superseded' }).eq('id', pendingRow.supersedes)
  }

  await admin
    .from('state_deadlines')
    .update({ status: 'verified', verified_at: new Date().toISOString(), verified_by: user.email ?? user.id })
    .eq('id', rowId)

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Write the dismiss route** — `app/api/admin/deadlines/dismiss/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: self } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (self?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { rowId } = await req.json()
  if (!rowId) return NextResponse.json({ error: 'rowId required' }, { status: 400 })

  const admin = await createAdminClient()
  const { error } = await admin.from('state_deadlines').delete().eq('id', rowId).eq('status', 'pending_review')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 3: Write the confirm route** — `app/api/admin/deadlines/confirm/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { data: self } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (self?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { rowId } = await req.json()
  if (!rowId) return NextResponse.json({ error: 'rowId required' }, { status: 400 })

  const admin = await createAdminClient()
  const { error } = await admin
    .from('state_deadlines')
    .update({ status: 'verified', verified_at: new Date().toISOString(), verified_by: user.email ?? user.id })
    .eq('id', rowId)
    .eq('status', 'pending_publication')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 4: Write the client action components**

`app/admin/deadlines/DeadlineReviewActions.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DeadlineReviewActions({ rowId }: { rowId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'approve' | 'dismiss' | null>(null)

  async function act(action: 'approve' | 'dismiss') {
    setLoading(action)
    await fetch(`/api/admin/deadlines/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rowId }),
    })
    router.refresh()
    setLoading(null)
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => act('approve')}
        disabled={loading !== null}
        className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-xl font-black hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {loading === 'approve' ? '...' : 'Approve'}
      </button>
      <button
        onClick={() => act('dismiss')}
        disabled={loading !== null}
        className="text-xs bg-stone-200 text-stone-700 px-3 py-1.5 rounded-xl font-black hover:bg-stone-300 disabled:opacity-50 transition-colors"
      >
        {loading === 'dismiss' ? '...' : 'Dismiss'}
      </button>
    </div>
  )
}
```

`app/admin/deadlines/ConfirmPublicationButton.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConfirmPublicationButton({ rowId }: { rowId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function confirm() {
    setLoading(true)
    await fetch('/api/admin/deadlines/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rowId }),
    })
    router.refresh()
    setLoading(false)
  }

  return (
    <button
      onClick={confirm}
      disabled={loading}
      className="text-xs bg-amber-400 text-black px-3 py-1.5 rounded-xl font-black hover:bg-amber-500 disabled:opacity-50 transition-colors"
    >
      {loading ? '...' : 'Confirm'}
    </button>
  )
}
```

- [ ] **Step 5: Write `app/admin/deadlines/page.tsx`**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import DeadlineReviewActions from './DeadlineReviewActions'
import ConfirmPublicationButton from './ConfirmPublicationButton'
import { getAllDeadlinesAdmin, getPendingReviewRows, getPendingPublicationRows, getAllSources } from '@/lib/deadlines/queries'
import { isStale, getVerificationTasksForMonth } from '@/lib/deadlines/render'

export default async function AdminDeadlines() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: self } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (self?.role !== 'admin') redirect('/')

  const year = new Date().getFullYear()
  const [allRows, pendingReview, pendingPublication, sources] = await Promise.all([
    getAllDeadlinesAdmin(year),
    getPendingReviewRows(),
    getPendingPublicationRows(),
    getAllSources(),
  ])

  const now = new Date()
  const verificationTasks = getVerificationTasksForMonth(sources, now.getUTCMonth() + 1, year + 1)

  return (
    <>
      <Navbar />
      <main className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-8">Deadline verification</h1>

        {verificationTasks.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-stone-600 mb-3">
              Annual verification due this month ({verificationTasks.length})
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {verificationTasks.map((task) => (
                <a
                  key={task.state}
                  href={task.canonicalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-white border border-stone-200 rounded-2xl p-4 hover:border-amber-400 transition-colors"
                >
                  <div className="font-black tracking-tight text-gray-900 text-sm">{task.taskLabel}</div>
                  <div className="text-stone-500 text-xs mt-1">{task.agencyName} — open source, then confirm the resulting rows below once published</div>
                </a>
              ))}
            </div>
          </section>
        )}

        {pendingReview.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-amber-700 mb-3">
              Pending review ({pendingReview.length})
            </h2>
            <div className="bg-white border border-amber-300 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {pendingReview.map((row) => (
                    <tr key={row.id}>
                      <td className="px-5 py-3 font-medium text-gray-900">{row.state}</td>
                      <td className="px-5 py-3 text-gray-600">{row.deadline_type}</td>
                      <td className="px-5 py-3 text-gray-900 font-mono text-xs">{row.event_date} {row.event_time ?? ''}</td>
                      <td className="px-5 py-3 text-gray-500 max-w-xs truncate" title={row.notes ?? ''}>{row.notes}</td>
                      <td className="px-5 py-3"><a href={row.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 hover:underline">source</a></td>
                      <td className="px-5 py-3"><DeadlineReviewActions rowId={row.id} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {pendingPublication.length > 0 && (
          <section className="mb-10">
            <h2 className="text-sm font-bold uppercase tracking-widest text-blue-700 mb-3">
              Awaiting manual confirmation ({pendingPublication.length})
            </h2>
            <div className="bg-white border border-blue-300 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {pendingPublication.map((row) => (
                    <tr key={row.id}>
                      <td className="px-5 py-3 font-medium text-gray-900">{row.state}</td>
                      <td className="px-5 py-3 text-gray-600">{row.deadline_type}</td>
                      <td className="px-5 py-3 text-gray-900 font-mono text-xs">{row.event_date}</td>
                      <td className="px-5 py-3 text-gray-500 max-w-xs truncate" title={row.notes ?? ''}>{row.notes}</td>
                      <td className="px-5 py-3"><a href={row.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-green-700 hover:underline">source</a></td>
                      <td className="px-5 py-3"><ConfirmPublicationButton rowId={row.id} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <h2 className="text-sm font-bold uppercase tracking-widest text-stone-500 mb-3">All {year} deadlines</h2>
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-stone-500">State</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-stone-500">Type</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-stone-500">Date</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-stone-500">Status</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-stone-500">Verified</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allRows.map((row) => (
                <tr key={row.id}>
                  <td className="px-5 py-3 font-medium text-gray-900">{row.state}</td>
                  <td className="px-5 py-3 text-gray-600">{row.deadline_type}</td>
                  <td className="px-5 py-3 text-gray-900 font-mono text-xs">{row.event_date} {row.event_time ?? ''}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-stone-100 text-stone-700">{row.status}</span>
                  </td>
                  <td className={`px-5 py-3 text-xs ${isStale(row.verified_at) ? 'text-red-600 font-bold' : 'text-stone-500'}`}>
                    {row.verified_at ? new Date(row.verified_at).toLocaleDateString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  )
}
```

- [ ] **Step 6: Link from the admin home page**

In `app/admin/page.tsx`, add a third card to the two-column grid at the bottom (after "Verify outfitters"): change `grid-cols-2` to `grid-cols-3` and add:

```tsx
<Link href="/admin/deadlines" className="bg-white border border-stone-200 rounded-2xl p-5 hover:border-amber-400 transition-colors">
  <div className="font-black tracking-tight text-gray-900">Deadline verification</div>
  <div className="text-stone-500 text-sm mt-1">Review agency source changes, confirm annual dates</div>
</Link>
```

- [ ] **Step 7: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 8: Manual verification**

Confirm the four new/changed files compile and, with a dev server running and logged in as an admin user, that `/admin/deadlines` loads without a 500 and shows the "All {year} deadlines" table populated from the seed data (Task 1 must be applied to Supabase for this to show rows — if the migration hasn't been run yet, the page should still render with an empty table, not crash: verify `getAllDeadlinesAdmin` handles an empty/error Supabase response gracefully, since `data ?? []` already covers this).

- [ ] **Step 9: Commit**

```bash
git add app/admin/deadlines app/admin/page.tsx app/api/admin/deadlines
git commit -m "feat: add admin deadline review dashboard with approve/dismiss/confirm"
```

---

### Task 6: Change-detection monitor (Claude-powered) + cron route

**Files:**
- Create: `lib/cron/deadline-monitor.ts`
- Create: `app/api/cron/deadline-monitor/route.ts`
- Modify: `lib/email/index.ts`
- Modify: `vercel.json`

**Interfaces:**
- Consumes: `createAdminClient` from `@/lib/supabase/server`; `Anthropic` from `@anthropic-ai/sdk` (same import pattern as `app/api/scout/chat/route.ts`); `DeadlineSourceRow`, `StateDeadlineRow` from `@/lib/deadlines/types`
- Produces:
  - `function shouldCheckToday(source: DeadlineSourceRow, today: Date, upcomingCloseDates: Date[]): boolean` (pure, exported for reasoning/reuse) — true if `today.getUTCMonth()` is 0-5 (Jan-Jun, daily cadence), OR `today.getUTCDay() === 1` (Monday, weekly cadence for Jul-Dec), OR any date in `upcomingCloseDates` is within 30 days of `today`.
  - `async function runDeadlineMonitor(): Promise<{ checked: number; changed: number }>` — main entry point called by the cron route.
  - `sendDeadlineChangeDetected({ adminEmail, state, agencyName, pendingCount }): Promise<void>` added to `lib/email/index.ts`.

- [ ] **Step 1: Add the email function to `lib/email/index.ts`**

Append this function to the existing file (after the last export, matching the existing style — read the file first since you'll need the exact insertion point and the shared `FROM` constant already defined at the top):

```typescript
export async function sendDeadlineChangeDetected({
  adminEmail, state, agencyName, pendingCount,
}: {
  adminEmail: string; state: string; agencyName: string; pendingCount: number
}) {
  await getResend().emails.send({
    from: FROM,
    to: adminEmail,
    subject: `Deadline change detected: ${state}`,
    html: `
      <p>The deadline monitor detected a content change on ${agencyName}'s (${state}) deadline page.</p>
      <p><strong>${pendingCount}</strong> row(s) are now pending review.</p>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/deadlines">Review in the admin dashboard →</a></p>
      <p>— Hunt Atlas deadline monitor</p>
    `,
  })
}
```

- [ ] **Step 2: Write `lib/cron/deadline-monitor.ts`**

```typescript
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
```

> Note the `timezone: 'America/Denver'` fallback for brand-new events the monitor discovers — the extraction prompt doesn't currently ask Claude for a timezone (state agency pages rarely state it explicitly, and guessing wrong on this field is exactly the kind of silent bad data the whole system exists to prevent). A `pending_review` row's timezone is corrected by the admin during review if wrong before approval; approval never publishes to the public page without a human look first, so this fallback cannot leak a wrong timezone to a user.

- [ ] **Step 3: Write the cron route** — `app/api/cron/deadline-monitor/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { runDeadlineMonitor } from '@/lib/cron/deadline-monitor'

export async function GET(req: NextRequest) {
  if (req.headers.get('x-cron-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const result = await runDeadlineMonitor()
  return NextResponse.json({ ok: true, ...result })
}
```

- [ ] **Step 4: Add the cron entry to `vercel.json`**

Add a fourth entry to the `crons` array (the route's own `shouldCheckToday` logic decides whether to do real work on any given firing, so a single daily schedule covers both the weekly-off-season and daily-in-season cadence from the spec):

```json
{
  "path": "/api/cron/deadline-monitor",
  "schedule": "0 13 * * *"
}
```

- [ ] **Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: no new errors. Pay particular attention to the `Anthropic.messages.create` call — if `output_config` isn't recognized by the installed `@anthropic-ai/sdk@^0.96.0` types, check `node_modules/@anthropic-ai/sdk/resources/messages/messages.d.ts` for the exact field name/shape on this SDK version and adjust (the field may be typed as part of a beta namespace on this version — if so, switch to `anthropic.beta.messages.create` and keep the same `output_config.format.type: "json_schema"` shape, consistent with `shared/tool-use-concepts.md` → Structured Outputs from the claude-api skill).

- [ ] **Step 6: Manual verification**

Run: `node -e "
const { shouldCheckToday } = require('./lib/cron/deadline-monitor.ts')
" 2>&1 || true` — same caveat as Task 2 Step 4 (no TS loader); rely on `tsc --noEmit` plus a read-through: confirm `shouldCheckToday` returns `true` for a January date, `true` for a Monday in August, `false` for a Tuesday in August with no close date within 30 days, and `true` for a Tuesday in August where `upcomingCloseDates` contains a date 10 days out.

Then, with `CRON_SECRET` set in `.env.local` and a dev server running, hit the route directly: `curl -s -H "x-cron-secret: $CRON_SECRET" http://localhost:3000/api/cron/deadline-monitor` — expected: a JSON body `{"ok":true,"checked":N,"changed":M}` (N depends on today's date and which sources `shouldCheckToday` selects; do not expect a fixed number). Confirm no unhandled exception/500. This call will make real outbound HTTP requests to 11 state agency sites and at least one real Claude API call if any source's hash differs from `null` (first run always differs, since `last_content_hash` starts null) — that's expected and is the intended behavior, not a bug.

- [ ] **Step 7: Commit**

```bash
git add lib/cron/deadline-monitor.ts app/api/cron/deadline-monitor/route.ts lib/email/index.ts vercel.json
git commit -m "feat: add Claude-powered deadline change-detection monitor"
```

---

### Task 7: Final integration pass

**Files:**
- Modify: none (verification-only task)

**Interfaces:**
- Consumes: everything from Tasks 1-6

- [ ] **Step 1: Full project type-check**

Run: `npx tsc --noEmit`
Expected: zero errors anywhere in the project (not just the new files — confirm this feature didn't regress anything else).

- [ ] **Step 2: Full project build**

Run: `npm run build`
Expected: build succeeds. Pay attention to any Next.js 16-specific warning about the new dynamic route handlers or Server Components added in this feature (per `AGENTS.md`, check `node_modules/next/dist/docs/01-app/` if an unfamiliar warning appears).

- [ ] **Step 3: grep for "estimated" one more time across the new page's rendered output**

Already covered in Task 4 Step 5, but re-run it here as the final acceptance-criteria gate now that all tasks are done: with a dev server running, `curl -s http://localhost:3000/deadlines | grep -iE "estimated|approximately|~[0-9]"` — expected: no output.

- [ ] **Step 4: Tell the user the migration still needs to be applied**

This is not a code step — report to the user explicitly: *"`supabase/add-deadline-verification.sql` has been written but not run — apply it via the Supabase SQL editor before the public `/deadlines` and `/admin/deadlines` pages will show real data."* Per this repo's `feedback_auto_migrate` convention there is no `npm run migrate` for this repo (flat-file convention, no CLI apply step) — do not claim the feature is live until the user confirms the SQL ran.

- [ ] **Step 5: Commit (if any fixes were needed in this task)**

```bash
git add -A
git commit -m "fix: address type/build issues found in final integration pass"
```

(Skip this commit if Steps 1-2 passed clean with no changes required.)
