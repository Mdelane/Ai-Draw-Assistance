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
