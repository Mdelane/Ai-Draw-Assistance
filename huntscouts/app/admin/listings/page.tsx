import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import AdminVerifyButton from './AdminVerifyButton'

export default async function AdminListings() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: self } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (self?.role !== 'admin') redirect('/')

  const { data: outfitters } = await supabase
    .from('outfitter_profiles')
    .select('id, business_name, state, license_number, license_verified, years_in_operation, users(email)')
    .order('license_verified', { ascending: true })

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-8">Outfitter verification</h1>
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-stone-500">Business</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-stone-500">Email</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-stone-500">State</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-stone-500">License #</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-stone-500">Status</th>
                <th className="px-5 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {outfitters?.map((o: any) => (
                <tr key={o.id}>
                  <td className="px-5 py-3 font-medium text-gray-900">{o.business_name}</td>
                  <td className="px-5 py-3 text-gray-500">{o.users?.email}</td>
                  <td className="px-5 py-3 text-gray-600">{o.state}</td>
                  <td className="px-5 py-3 text-gray-500 font-mono text-xs">{o.license_number ?? '—'}</td>
                  <td className="px-5 py-3">
                    {o.license_verified
                      ? <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Verified</span>
                      : <span className="text-xs font-medium text-yellow-700 bg-yellow-100 px-2 py-0.5 rounded-full">Pending</span>}
                  </td>
                  <td className="px-5 py-3">
                    {!o.license_verified && <AdminVerifyButton outfitterId={o.id} />}
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
