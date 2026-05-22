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
          <h1 className="text-3xl font-bold text-[#1B4332] mb-2">Welcome to HuntScouts</h1>
          {foundingOutfitter ? (
            <p className="text-amber-700 font-medium">You&apos;re a Founding Outfitter — locked in at 7% commission</p>
          ) : (
            <p className="text-gray-500">Set up your outfitter profile to start listing hunts.</p>
          )}
        </div>
        <OutfitterOnboardingForm userId={user.id} foundingOutfitter={foundingOutfitter} />
      </main>
    </>
  )
}
