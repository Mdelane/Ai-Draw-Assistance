import Navbar from '@/components/Navbar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ResendButton from './ResendButton'

export default async function VerifyEmailPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Already verified — send them on their way
  if (user?.email_confirmed_at) {
    redirect('/dashboard')
  }

  return (
    <>
      <Navbar />
      <main className="max-w-md mx-auto px-6 py-20 text-center">
        <div className="text-5xl mb-6">📬</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Check your inbox</h1>
        <p className="text-gray-600 mb-2">
          We sent a confirmation link to <strong>{user?.email}</strong>
        </p>
        <p className="text-gray-500 text-sm mb-8">
          Scout AI is unlocked once you verify. The free draw odds table is available now.
        </p>
        <ResendButton email={user?.email ?? ''} />
        <p className="text-xs text-gray-400 mt-6">
          Check your spam folder if you don&apos;t see it within a minute.
        </p>
      </main>
    </>
  )
}
