import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OutfitterOnboardingForm from './OutfitterOnboardingForm'
import Navbar from '@/components/Navbar'

export default async function OutfitterOnboarding() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // If they already have a profile, skip onboarding
  const { data: existing } = await supabase
    .from('outfitter_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existing) redirect('/outfitter/dashboard')

  const foundingOutfitter = user.user_metadata?.founding_outfitter === true

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-6 py-12">
        <div className="text-center mb-10">
          {foundingOutfitter && (
            <span className="inline-block bg-amber-100 text-amber-800 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
              Founding Outfitter — 7% commission locked in
            </span>
          )}
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Welcome to HuntScouts</h1>
          {foundingOutfitter ? (
            <p className="text-gray-500">You&apos;re early. Let&apos;s get your profile set up so you can start taking bookings.</p>
          ) : (
            <p className="text-gray-500">Set up your outfitter profile to start listing hunts.</p>
          )}
        </div>
        <OutfitterOnboardingForm userId={user.id} foundingOutfitter={foundingOutfitter} />
      </main>
    </>
  )
}
