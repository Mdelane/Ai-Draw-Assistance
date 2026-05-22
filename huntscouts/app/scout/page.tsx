import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ScoutChat from './ScoutChat'
import ScoutOnboarding from './ScoutOnboarding'
import OutfitterCards from './OutfitterCards'

const STATES = ['CO', 'WY', 'MT', 'UT', 'ID', 'AZ', 'NV']

type SearchParams = {
  state?: string
  species?: string
  weapon?: string
  points?: string
  year?: string
}

export default async function ScoutPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  let isScoutPro = false
  let emailVerified = false
  let freeQueryUsed = false
  let onboardingDismissed = false
  let scoutProfileCompleted = false

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('scout_subscription_status, scout_current_period_end, scout_status, scout_trial_end, scout_trial_queries_used, scout_free_query_used, scout_onboarding_dismissed')
      .eq('id', user.id)
      .single()

    emailVerified = !!user.email_confirmed_at
    freeQueryUsed = profile?.scout_free_query_used ?? false
    onboardingDismissed = profile?.scout_onboarding_dismissed ?? false

    const scoutStatus = profile?.scout_status ?? 'free'
    const trialQueriesUsed = profile?.scout_trial_queries_used ?? 0

    isScoutPro =
      (profile?.scout_subscription_status === 'active' &&
        !!profile?.scout_current_period_end &&
        new Date(profile.scout_current_period_end) > new Date()) ||
      (scoutStatus === 'trial' &&
        !!profile?.scout_trial_end &&
        new Date(profile.scout_trial_end) > new Date() &&
        trialQueriesUsed < 20)
  }

  // Fetch user's scout profile and points
  let pointsCombos: any[] = []
  if (user) {
    const adminSupabase = await createAdminClient()
    const [{ data: scoutProfile }, { data: points }] = await Promise.all([
      adminSupabase.from('scout_profiles').select('completed').eq('user_id', user.id).single(),
      adminSupabase.from('scout_points').select('*').eq('user_id', user.id).order('is_primary', { ascending: false }).order('created_at'),
    ])
    scoutProfileCompleted = scoutProfile?.completed ?? false
    pointsCombos = points ?? []
  }

  // Draw odds table data
  let availableSpecies: string[] = []
  let availableWeapons: string[] = []
  let availableYears: number[] = []

  if (params.state) {
    const { data: speciesData } = await supabase.from('draw_odds').select('species').eq('state', params.state)
    availableSpecies = [...new Set(speciesData?.map((r: any) => r.species) ?? [])]

    if (params.species) {
      const { data: weaponData } = await supabase.from('draw_odds').select('weapon_type').eq('state', params.state).eq('species', params.species)
      availableWeapons = [...new Set(weaponData?.map((r: any) => r.weapon_type) ?? [])]

      const { data: yearData } = await supabase.from('draw_odds').select('year').eq('state', params.state).eq('species', params.species)
      availableYears = [...new Set(yearData?.map((r: any) => r.year) ?? [])].sort((a, b) => b - a)
    }
  }

  const selectedYear = params.year ? parseInt(params.year) : availableYears[0] ?? new Date().getFullYear()
  const userPoints = params.points ? parseInt(params.points) : null

  let oddsData: any[] = []
  let prevYearData: any[] = []

  if (params.state && params.species && params.weapon) {
    const { data } = await supabase
      .from('draw_odds')
      .select('unit_number, draw_odds_percent, avg_points_drawn, min_points_drawn, total_applicants, successful_draws')
      .eq('state', params.state)
      .eq('species', params.species)
      .eq('weapon_type', params.weapon)
      .eq('year', selectedYear)
      .order('draw_odds_percent', { ascending: false })
    oddsData = data ?? []

    const { data: prev } = await supabase
      .from('draw_odds')
      .select('unit_number, draw_odds_percent')
      .eq('state', params.state)
      .eq('species', params.species)
      .eq('weapon_type', params.weapon)
      .eq('year', selectedYear - 1)
    prevYearData = prev ?? []
  }

  const prevYearMap = Object.fromEntries(prevYearData.map((r: any) => [r.unit_number, r.draw_odds_percent]))

  const needsOnboarding = user && emailVerified && !scoutProfileCompleted && !onboardingDismissed

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* Email verification banner */}
        {user && !emailVerified && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-5 py-4 mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-yellow-900">Verify your email to use Scout AI</p>
              <p className="text-sm text-yellow-700 mt-0.5">Check your inbox for a confirmation link.</p>
            </div>
            <Link href="/verify-email" className="shrink-0 text-sm text-yellow-800 underline font-medium">Resend</Link>
          </div>
        )}

        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1B4332]">Scout</h1>
            <p className="text-gray-500 mt-1">AI-powered western big game draw strategy</p>
          </div>
          {!isScoutPro && (
            <Link href="/scout/upgrade" className="bg-[#1B4332] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#163828] transition-colors">
              Upgrade to Scout Pro →
            </Link>
          )}
        </div>

        {/* Onboarding gate */}
        {needsOnboarding && <ScoutOnboarding onComplete={() => {}} onDismiss={() => {}} />}

        {/* Dismissed onboarding warning */}
        {user && emailVerified && !scoutProfileCompleted && onboardingDismissed && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 mb-6 flex items-center justify-between gap-4">
            <p className="text-sm text-amber-800">
              ⚠️ Without your profile, Scout can't offer its full potential.
            </p>
            <button
              onClick={() => {}}
              className="shrink-0 text-sm font-medium text-amber-900 underline"
            >
              Complete profile →
            </button>
          </div>
        )}

        {/* Not logged in CTA */}
        {!user && (
          <div className="bg-[#1B4332] text-white rounded-2xl p-8 text-center mb-8">
            <h2 className="text-xl font-bold mb-2">Stop guessing. Apply for the right unit.</h2>
            <p className="text-green-200 mb-5 text-sm">
              Scout AI analyzes your preference points, draw trends, and unit data to tell you exactly where to apply.
              Create a free account to get started.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/signup?next=/scout" className="bg-white text-[#1B4332] px-6 py-2.5 rounded-lg font-medium hover:bg-green-50 transition-colors">
                Create free account
              </Link>
              <Link href="/login?next=/scout" className="border border-green-400 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-white/10 transition-colors">
                Sign in
              </Link>
            </div>
          </div>
        )}

        {/* Scout AI — leads the page */}
        {user && emailVerified && (
          <div className="mb-10">
            <ScoutChat
              pointsCombos={pointsCombos}
              isPro={isScoutPro}
              freeQueryUsed={freeQueryUsed}
              emailVerified={emailVerified}
            />
            {pointsCombos.length > 0 && (
              <div className="mt-6">
                <OutfitterCards state={pointsCombos[0].state} species={pointsCombos[0].species} />
              </div>
            )}
          </div>
        )}

        {/* Draw odds table — reference section */}
        <div className="border-t border-gray-100 pt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">Draw odds reference table</h2>
          <p className="text-sm text-gray-400 mb-6">Browse raw draw odds data by state, species, and weapon. Free for all users.</p>

          <form method="get" className="grid grid-cols-5 gap-3 mb-6">
            <select name="state" defaultValue={params.state ?? ''} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]">
              <option value="">Select state</option>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select name="species" defaultValue={params.species ?? ''} disabled={!availableSpecies.length} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] disabled:bg-gray-50 disabled:text-gray-400">
              <option value="">Select species</option>
              {availableSpecies.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
            <select name="weapon" defaultValue={params.weapon ?? ''} disabled={!availableWeapons.length} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] disabled:bg-gray-50 disabled:text-gray-400">
              <option value="">Weapon type</option>
              {availableWeapons.map(w => <option key={w} value={w} className="capitalize">{w}</option>)}
            </select>
            <input
              type="number" name="points" min={0}
              defaultValue={params.points ?? ''}
              placeholder="My points"
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
            <button type="submit" className="bg-[#1B4332] text-white rounded-lg text-sm font-medium hover:bg-[#163828] transition-colors">
              Search
            </button>
          </form>

          {availableYears.length > 1 && (
            <div className="flex gap-2 mb-5">
              {availableYears.map(y => (
                <Link
                  key={y}
                  href={`/scout?state=${params.state}&species=${params.species}&weapon=${params.weapon}&points=${params.points ?? ''}&year=${y}`}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${y === selectedYear ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {y}
                </Link>
              ))}
            </div>
          )}

          {params.state && params.species && params.weapon ? (
            oddsData.length > 0 ? (
              <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="text-left px-5 py-3 font-medium text-gray-600">Unit</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-600">Draw Odds</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-600">Avg Pts</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-600">Min Pts</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-600">Applicants</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-600">Draws</th>
                      <th className="text-left px-5 py-3 font-medium text-gray-600">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {oddsData.map((row: any) => {
                      const isReachable = userPoints !== null && (row.min_points_drawn ?? 0) <= userPoints
                      const prevOdds = prevYearMap[row.unit_number]
                      const trend = prevOdds != null
                        ? row.draw_odds_percent > prevOdds ? '↑' : row.draw_odds_percent < prevOdds ? '↓' : '→'
                        : '—'
                      const trendColor = trend === '↑' ? 'text-green-600' : trend === '↓' ? 'text-red-500' : 'text-gray-400'
                      return (
                        <tr key={row.unit_number} className={isReachable ? 'bg-green-50' : ''}>
                          <td className="px-5 py-3 font-medium text-gray-900">{row.unit_number}</td>
                          <td className="px-5 py-3 text-gray-700">{row.draw_odds_percent != null ? `${row.draw_odds_percent}%` : '—'}</td>
                          <td className="px-5 py-3 text-gray-600">{row.avg_points_drawn ?? '—'}</td>
                          <td className="px-5 py-3 text-gray-600">{row.min_points_drawn ?? '—'}</td>
                          <td className="px-5 py-3 text-gray-600">{row.total_applicants?.toLocaleString() ?? '—'}</td>
                          <td className="px-5 py-3 text-gray-600">{row.successful_draws?.toLocaleString() ?? '—'}</td>
                          <td className={`px-5 py-3 font-medium ${trendColor}`}>{trend}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                {userPoints !== null && (
                  <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-500 bg-green-50">
                    Green rows = units reachable with your {userPoints} points
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400">
                No data yet for {params.state} {params.species} ({params.weapon}).
                <br />Data is sourced from state game agencies via FOIA requests.
              </div>
            )
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400">
              Select a state, species, and weapon type to see draw odds.
            </div>
          )}
        </div>

      </main>
    </>
  )
}
