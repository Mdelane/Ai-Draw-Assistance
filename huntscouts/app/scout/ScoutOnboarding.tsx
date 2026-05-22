'use client'

import { useState } from 'react'

const STATES = ['AK','AL','AR','AZ','CA','CO','CT','DE','FL','GA','HI','IA','ID','IL','IN','KS','KY','LA','MA','MD','ME','MI','MN','MO','MS','MT','NC','ND','NE','NH','NJ','NM','NV','NY','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VA','VT','WA','WI','WV','WY']
const SPECIES = ['Elk','Mule Deer','Whitetail Deer','Antelope','Moose','Bighorn Sheep','Mountain Goat','Black Bear','Bison','Mountain Lion','Wild Turkey']
const WEAPONS = ['Rifle','Archery','Muzzleloader','Any']

type PointsEntry = {
  id: string
  state: string
  species: string
  weapon_type: string
  points: number
  years_applying: number
  is_primary: boolean
}

type Profile = {
  experience_level: string
  home_state: string
  strategy: string
  timeline: string
  group_hunting: boolean
  group_size: number | null
  terrain_preference: string
  fitness_level: string
  physical_limitations: string
  goal: string
  first_time_species: boolean | null
  ever_drawn: boolean | null
  ever_guided: boolean | null
  guide_preference: string
  budget_range: string
  alert_odds_change: boolean
  alert_deadline: boolean
  completed: boolean
}

const TOTAL_STEPS = 8

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
        <div
          className="h-1.5 rounded-full bg-[#1B4332] transition-all duration-300"
          style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
        />
      </div>
      <span className="text-xs text-gray-400 shrink-0">{step} of {TOTAL_STEPS}</span>
    </div>
  )
}

function OptionCard({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
        selected
          ? 'border-[#1B4332] bg-[#1B4332] text-white'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  )
}

export default function ScoutOnboarding({ onComplete, onDismiss }: { onComplete: () => void; onDismiss: () => void }) {
  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)

  const [profile, setProfile] = useState<Profile>({
    experience_level: '',
    home_state: '',
    strategy: '',
    timeline: '',
    group_hunting: false,
    group_size: null,
    terrain_preference: '',
    fitness_level: '',
    physical_limitations: '',
    goal: '',
    first_time_species: null,
    ever_drawn: null,
    ever_guided: null,
    guide_preference: '',
    budget_range: '',
    alert_odds_change: false,
    alert_deadline: false,
    completed: false,
  })

  const [points, setPoints] = useState<PointsEntry[]>([])

  function addPointsEntry() {
    setPoints(p => [...p, {
      id: crypto.randomUUID(),
      state: '',
      species: '',
      weapon_type: '',
      points: 0,
      years_applying: 0,
      is_primary: p.length === 0,
    }])
  }

  function updatePointsEntry(id: string, field: keyof PointsEntry, value: any) {
    setPoints(p => p.map(e => e.id === id ? { ...e, [field]: value } : e))
  }

  function removePointsEntry(id: string) {
    setPoints(p => {
      const remaining = p.filter(e => e.id !== id)
      if (remaining.length > 0 && !remaining.some(e => e.is_primary)) {
        remaining[0].is_primary = true
      }
      return remaining
    })
  }

  function setPrimary(id: string) {
    setPoints(p => p.map(e => ({ ...e, is_primary: e.id === id })))
  }

  async function save(completed: boolean) {
    setSaving(true)
    const finalProfile = { ...profile, completed }
    await fetch('/api/scout/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profile: finalProfile,
        points: points.filter(p => p.state && p.species && p.weapon_type).map(({ id, ...rest }) => rest),
      }),
    })
    setSaving(false)
    onComplete()
  }

  async function dismiss() {
    await fetch('/api/scout/dismiss-onboarding', { method: 'POST' })
    onDismiss()
  }

  // Step 0: Welcome
  if (step === 0) {
    return (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-lg w-full p-8 text-center">
          <div className="text-5xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-[#1B4332] mb-3">Build your Scout profile</h2>
          <p className="text-gray-500 mb-2">
            The more we know about your points, goals, and preferences, the better your AI recommendations will be.
          </p>
          <p className="text-gray-400 text-sm mb-8">Takes about 2 minutes. Every question is optional.</p>
          <button
            onClick={() => setStep(1)}
            className="w-full bg-[#1B4332] text-white py-3 rounded-xl font-medium hover:bg-[#163828] transition-colors mb-3"
          >
            Let's go →
          </button>
          <button
            onClick={dismiss}
            className="w-full text-sm text-gray-400 hover:text-gray-600 py-2"
          >
            I'll do this later — but Scout may not be as accurate
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto">
        <ProgressBar step={step} />

        {/* Step 1: Experience + Home State */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">How experienced are you?</h2>
            <p className="text-gray-400 text-sm mb-6">This helps Scout calibrate its advice.</p>
            <div className="space-y-3 mb-6">
              {[
                { value: 'beginner', label: 'Beginner — new to draw hunting' },
                { value: 'intermediate', label: 'Intermediate — applied a few times' },
                { value: 'expert', label: 'Expert — been at this for years' },
              ].map(o => (
                <OptionCard key={o.value} label={o.label} selected={profile.experience_level === o.value} onClick={() => setProfile(p => ({ ...p, experience_level: o.value }))} />
              ))}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Your home state</label>
              <select
                value={profile.home_state}
                onChange={e => setProfile(p => ({ ...p, home_state: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              >
                <option value="">Select state</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Points Inventory */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">What tags are you applying for?</h2>
            <p className="text-gray-400 text-sm mb-6">Add every state, species, and weapon combo you have points in. Scout will know which tags are yours.</p>
            <div className="space-y-4 mb-4">
              {points.map((entry, i) => (
                <div key={entry.id} className="border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-700">Tag #{i + 1}</span>
                    <div className="flex items-center gap-3">
                      {points.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setPrimary(entry.id)}
                          className={`text-xs px-2 py-1 rounded-full ${entry.is_primary ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                          {entry.is_primary ? '★ Primary' : 'Set primary'}
                        </button>
                      )}
                      <button type="button" onClick={() => removePointsEntry(entry.id)} className="text-red-400 hover:text-red-600 text-xs">Remove</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">State</label>
                      <select value={entry.state} onChange={e => updatePointsEntry(entry.id, 'state', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]">
                        <option value="">Select</option>
                        {STATES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Species</label>
                      <select value={entry.species} onChange={e => updatePointsEntry(entry.id, 'species', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]">
                        <option value="">Select</option>
                        {SPECIES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Weapon</label>
                      <select value={entry.weapon_type} onChange={e => updatePointsEntry(entry.id, 'weapon_type', e.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]">
                        <option value="">Select</option>
                        {WEAPONS.map(w => <option key={w} value={w}>{w}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Points</label>
                      <input type="number" min={0} value={entry.points} onChange={e => updatePointsEntry(entry.id, 'points', parseInt(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs text-gray-500 mb-1 block">Years applying</label>
                      <input type="number" min={0} value={entry.years_applying} onChange={e => updatePointsEntry(entry.id, 'years_applying', parseInt(e.target.value) || 0)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" onClick={addPointsEntry} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-3 text-sm text-gray-400 hover:border-gray-300 hover:text-gray-500 transition-colors">
              + Add a tag
            </button>
          </div>
        )}

        {/* Step 3: Strategy */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">How do you approach your points?</h2>
            <p className="text-gray-400 text-sm mb-6">This shapes how Scout balances odds vs. waiting.</p>
            <div className="space-y-3 mb-8">
              {[
                { value: 'burn', label: 'Burn them — I want to draw something great this year' },
                { value: 'protect', label: 'Protect them — I\'m building toward a specific unit' },
                { value: 'flexible', label: 'Flexible — depends on the opportunity' },
              ].map(o => (
                <OptionCard key={o.value} label={o.label} selected={profile.strategy === o.value} onClick={() => setProfile(p => ({ ...p, strategy: o.value }))} />
              ))}
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Timeline goal</h2>
            <p className="text-gray-400 text-sm mb-4">When do you want to draw?</p>
            <div className="space-y-3">
              {[
                { value: 'this_year', label: 'This year — maximize my odds now' },
                { value: '2_3_years', label: 'Within 2–3 years' },
                { value: 'whenever', label: 'Whenever the right unit comes up' },
              ].map(o => (
                <OptionCard key={o.value} label={o.label} selected={profile.timeline === o.value} onClick={() => setProfile(p => ({ ...p, timeline: o.value }))} />
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Preferences */}
        {step === 4 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Hunt preferences</h2>
            <p className="text-gray-400 text-sm mb-6">Skip anything that doesn't apply.</p>

            <label className="text-sm font-medium text-gray-700 block mb-2">Terrain preference</label>
            <div className="grid grid-cols-2 gap-2 mb-6">
              {[
                { value: 'high_country', label: 'High country' },
                { value: 'flat', label: 'Flat / rolling' },
                { value: 'mixed', label: 'Mixed' },
                { value: 'no_preference', label: 'No preference' },
              ].map(o => (
                <OptionCard key={o.value} label={o.label} selected={profile.terrain_preference === o.value} onClick={() => setProfile(p => ({ ...p, terrain_preference: o.value }))} />
              ))}
            </div>

            <label className="text-sm font-medium text-gray-700 block mb-2">Fitness level</label>
            <div className="space-y-2 mb-6">
              {[
                { value: 'light', label: 'Light — I prefer easy access' },
                { value: 'moderate', label: 'Moderate — I can handle some elevation' },
                { value: 'strenuous', label: 'Strenuous — backcountry is fine' },
              ].map(o => (
                <OptionCard key={o.value} label={o.label} selected={profile.fitness_level === o.value} onClick={() => setProfile(p => ({ ...p, fitness_level: o.value }))} />
              ))}
            </div>

            <label className="text-sm font-medium text-gray-700 block mb-2">Guide preference</label>
            <div className="space-y-2 mb-6">
              {[
                { value: 'solo', label: 'DIY — I hunt on my own' },
                { value: 'guided', label: 'Guided — I want an outfitter' },
                { value: 'either', label: 'Either is fine' },
              ].map(o => (
                <OptionCard key={o.value} label={o.label} selected={profile.guide_preference === o.value} onClick={() => setProfile(p => ({ ...p, guide_preference: o.value }))} />
              ))}
            </div>

            {(profile.guide_preference === 'guided' || profile.guide_preference === 'either') && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Budget for a guided hunt</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Under $5k', '$5k–$10k', '$10k–$20k', '$20k+'].map(b => (
                    <OptionCard key={b} label={b} selected={profile.budget_range === b} onClick={() => setProfile(p => ({ ...p, budget_range: b }))} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Group hunting */}
        {step === 5 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Are you hunting alone or with a group?</h2>
            <p className="text-gray-400 text-sm mb-6">Group applications need everyone to draw the same unit — Scout factors this in.</p>
            <div className="space-y-3 mb-6">
              <OptionCard label="Solo — just me" selected={!profile.group_hunting} onClick={() => setProfile(p => ({ ...p, group_hunting: false, group_size: null }))} />
              <OptionCard label="Group — we're all applying together" selected={profile.group_hunting} onClick={() => setProfile(p => ({ ...p, group_hunting: true }))} />
            </div>
            {profile.group_hunting && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">How many hunters in your group?</label>
                <input
                  type="number" min={2} max={20}
                  value={profile.group_size ?? ''}
                  onChange={e => setProfile(p => ({ ...p, group_size: parseInt(e.target.value) || null }))}
                  placeholder="e.g. 3"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>
            )}
          </div>
        )}

        {/* Step 6: Goals */}
        {step === 6 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">What are you hunting for?</h2>
            <p className="text-gray-400 text-sm mb-6">Trophy quality vs. odds vs. filling the freezer — Scout will weigh them accordingly.</p>
            <div className="space-y-3 mb-8">
              {[
                { value: 'trophy', label: 'Trophy — I want a big animal, even if odds are lower' },
                { value: 'meat', label: 'Meat — I want to fill the freezer, maximize odds' },
                { value: 'both', label: 'Both — I\'d take either' },
              ].map(o => (
                <OptionCard key={o.value} label={o.label} selected={profile.goal === o.value} onClick={() => setProfile(p => ({ ...p, goal: o.value }))} />
              ))}
            </div>

            <h2 className="text-xl font-bold text-gray-900 mb-4">A couple more quick ones</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Have you ever drawn this species before?</p>
                <div className="grid grid-cols-2 gap-2">
                  <OptionCard label="Yes" selected={profile.ever_drawn === true} onClick={() => setProfile(p => ({ ...p, ever_drawn: true }))} />
                  <OptionCard label="No" selected={profile.ever_drawn === false} onClick={() => setProfile(p => ({ ...p, ever_drawn: false }))} />
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Have you ever been on a guided hunt?</p>
                <div className="grid grid-cols-2 gap-2">
                  <OptionCard label="Yes" selected={profile.ever_guided === true} onClick={() => setProfile(p => ({ ...p, ever_guided: true }))} />
                  <OptionCard label="No" selected={profile.ever_guided === false} onClick={() => setProfile(p => ({ ...p, ever_guided: false }))} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 7: Physical */}
        {step === 7 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Any physical considerations?</h2>
            <p className="text-gray-400 text-sm mb-6">Scout can steer you away from units that require extreme hiking if needed.</p>
            <textarea
              value={profile.physical_limitations}
              onChange={e => setProfile(p => ({ ...p, physical_limitations: e.target.value }))}
              placeholder="e.g. Bad knee, can't do more than 5 miles a day — or leave blank"
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] resize-none"
            />
          </div>
        )}

        {/* Step 8: Alerts */}
        {step === 8 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Stay in the loop</h2>
            <p className="text-gray-400 text-sm mb-6">We'll notify you when it matters — never spam.</p>
            <div className="space-y-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.alert_odds_change}
                  onChange={e => setProfile(p => ({ ...p, alert_odds_change: e.target.checked }))}
                  className="mt-1 accent-[#1B4332]"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">Draw odds alert</p>
                  <p className="text-xs text-gray-400">Notify me when draw odds change significantly for my units</p>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={profile.alert_deadline}
                  onChange={e => setProfile(p => ({ ...p, alert_deadline: e.target.checked }))}
                  className="mt-1 accent-[#1B4332]"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">Application deadline reminder</p>
                  <p className="text-xs text-gray-400">Remind me 2 weeks before my state's application deadline</p>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8">
          <button
            type="button"
            onClick={() => setStep(s => s - 1)}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← Back
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                if (step < TOTAL_STEPS) setStep(s => s + 1)
                else save(true)
              }}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Skip
            </button>
            {step < TOTAL_STEPS ? (
              <button
                type="button"
                onClick={() => setStep(s => s + 1)}
                className="bg-[#1B4332] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#163828] transition-colors"
              >
                Continue →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => save(true)}
                disabled={saving}
                className="bg-[#1B4332] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#163828] transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Finish →'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
