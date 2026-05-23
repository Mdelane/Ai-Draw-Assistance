import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'

export default async function AdminUsers() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: self } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (self?.role !== 'admin') redirect('/')

  const { data: users } = await supabase
    .from('users')
    .select('id, email, full_name, role, scout_subscription_status, created_at')
    .order('created_at', { ascending: false })

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-8">Users ({users?.length ?? 0})</h1>
        <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-stone-500">Name</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-stone-500">Email</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-stone-500">Role</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-stone-500">Scout</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-widest text-stone-500">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users?.map((u: any) => (
                <tr key={u.id}>
                  <td className="px-5 py-3 text-gray-900">{u.full_name ?? '—'}</td>
                  <td className="px-5 py-3 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      u.role === 'outfitter' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {u.scout_subscription_status === 'active'
                      ? <span className="text-xs font-medium text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Pro</span>
                      : <span className="text-xs text-gray-400">Free</span>}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
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
