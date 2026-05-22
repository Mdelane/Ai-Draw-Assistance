import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    redirect(profile?.role === 'outfitter' ? '/outfitter/dashboard' : '/dashboard')
  }

  return <>{children}</>
}
