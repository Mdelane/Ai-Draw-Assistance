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
