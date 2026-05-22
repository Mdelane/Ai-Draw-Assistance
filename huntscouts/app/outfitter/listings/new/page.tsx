'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

const CANCELLATION_POLICIES = [
  { value: 'flexible' as const, label: 'Flexible', description: 'Full refund 60+ days out · Full refund 30–59 days · 50% refund under 30 days' },
  { value: 'moderate' as const, label: 'Moderate (recommended)', description: 'Full refund 60+ days out · 50% refund 30–59 days · No refund under 30 days' },
  { value: 'strict' as const, label: 'Strict', description: '50% refund 60+ days out · No refund under 60 days (platform minimum)' },
]

const SPECIES = ['elk', 'mule deer', 'whitetail', 'pronghorn', 'bear', 'bighorn sheep', 'mountain goat']
const STATES = ['CO', 'WY', 'MT', 'UT', 'ID', 'AZ', 'NV']
const WEAPON_TYPES = ['rifle', 'archery', 'muzzleloader', 'crossbow']
const TERRAIN_LABELS = ['', 'Easy', 'Moderate', 'Strenuous', 'Pack-in', 'Extreme']

type FormData = {
  title: string
  species: string[]
  states: string[]
  weapon_types: string[]
  hunt_style: string
  access_type: string
  terrain_difficulty: number
  duration_days: string
  group_size_min: string
  group_size_max: string
  lodging_type: string
  base_price: string
  deposit_amount: string
  description: string
  success_rate_override: string
  is_combination_hunt: boolean
  ada_accessible: boolean
  points_required: boolean
  booking_type: 'instant' | 'request'
  cancellation_policy: 'flexible' | 'moderate' | 'strict'
  unit: string
}

export default function NewListingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [completedBookings, setCompletedBookings] = useState<number | null>(null)

  useEffect(() => {
    async function fetchProfile() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase
        .from('outfitter_profiles')
        .select('completed_bookings_count, wants_instant_booking')
        .eq('user_id', user.id)
        .single()
      if (data) setCompletedBookings(data.completed_bookings_count ?? 0)
    }
    fetchProfile()
  }, [])

  const isCoolingPeriod = completedBookings !== null && completedBookings < 3

  const [form, setForm] = useState<FormData>({
    title: '',
    species: [],
    states: [],
    weapon_types: [],
    hunt_style: '',
    access_type: '',
    terrain_difficulty: 3,
    duration_days: '',
    group_size_min: '1',
    group_size_max: '',
    lodging_type: '',
    base_price: '',
    deposit_amount: '',
    description: '',
    success_rate_override: '',
    is_combination_hunt: false,
    ada_accessible: false,
    points_required: false,
    booking_type: 'request',
    cancellation_policy: 'moderate' as const,
    unit: '',
  })

  function toggleMulti(field: 'species' | 'states' | 'weapon_types', value: string) {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(value)
        ? f[field].filter(v => v !== value)
        : [...f[field], value],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in'); setLoading(false); return }

    const { data: outfitterProfile } = await supabase
      .from('outfitter_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!outfitterProfile) {
      setError('Outfitter profile not found. Please complete your profile first.')
      setLoading(false)
      return
    }

    const { error } = await supabase.from('listings').insert({
      outfitter_id: outfitterProfile.id,
      title: form.title,
      species: form.species,
      states: form.states,
      weapon_types: form.weapon_types,
      hunt_style: form.hunt_style || null,
      access_type: form.access_type || null,
      terrain_difficulty: form.terrain_difficulty,
      duration_days: form.duration_days ? parseInt(form.duration_days) : null,
      group_size_min: parseInt(form.group_size_min),
      group_size_max: form.group_size_max ? parseInt(form.group_size_max) : null,
      lodging_type: form.lodging_type || null,
      base_price: parseFloat(form.base_price),
      deposit_amount: form.deposit_amount ? parseFloat(form.deposit_amount) : null,
      description: form.description || null,
      success_rate_override: form.success_rate_override ? parseFloat(form.success_rate_override) : null,
      is_combination_hunt: form.is_combination_hunt,
      ada_accessible: form.ada_accessible,
      points_required: form.points_required,
      booking_type: form.booking_type,
      cancellation_policy: form.cancellation_policy,
      unit: form.unit || null,
    })

    if (error) { setError(error.message); setLoading(false); return }
    router.push('/outfitter/listings')
  }

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">New listing</h1>

        <form onSubmit={handleSubmit} className="space-y-7">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

          {/* Title */}
          <Field label="Listing title">
            <input
              type="text" required value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. 5-Day Elk Archery Hunt in Unit 12"
              className={input}
            />
          </Field>

          {/* Species */}
          <Field label="Species">
            <div className="flex flex-wrap gap-2">
              {SPECIES.map(s => (
                <Chip key={s} label={s} active={form.species.includes(s)} onClick={() => toggleMulti('species', s)} />
              ))}
            </div>
          </Field>

          {/* States */}
          <Field label="States">
            <div className="flex flex-wrap gap-2">
              {STATES.map(s => (
                <Chip key={s} label={s} active={form.states.includes(s)} onClick={() => toggleMulti('states', s)} />
              ))}
            </div>
          </Field>

          {/* Weapon types */}
          <Field label="Weapon types">
            <div className="flex flex-wrap gap-2">
              {WEAPON_TYPES.map(w => (
                <Chip key={w} label={w} active={form.weapon_types.includes(w)} onClick={() => toggleMulti('weapon_types', w)} />
              ))}
            </div>
          </Field>

          {/* Hunt style + Access type */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Hunt style">
              <select value={form.hunt_style} onChange={e => setForm(f => ({ ...f, hunt_style: e.target.value }))} className={input}>
                <option value="">Select...</option>
                {['spot-and-stalk', 'stand hunting', 'calling', 'dog hunting'].map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Access type">
              <select value={form.access_type} onChange={e => setForm(f => ({ ...f, access_type: e.target.value }))} className={input}>
                <option value="">Select...</option>
                {['public', 'private', 'high_fence', 'mixed'].map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
          </div>

          {/* Terrain difficulty */}
          <Field label={`Terrain difficulty — ${TERRAIN_LABELS[form.terrain_difficulty]}`}>
            <input
              type="range" min={1} max={5} value={form.terrain_difficulty}
              onChange={e => setForm(f => ({ ...f, terrain_difficulty: parseInt(e.target.value) }))}
              className="w-full accent-[#1B4332]"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              {TERRAIN_LABELS.slice(1).map(l => <span key={l}>{l}</span>)}
            </div>
          </Field>

          {/* Duration + Group size */}
          <div className="grid grid-cols-3 gap-4">
            <Field label="Duration (days)">
              <input type="number" min={1} value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: e.target.value }))} className={input} />
            </Field>
            <Field label="Min group size">
              <input type="number" min={1} value={form.group_size_min} onChange={e => setForm(f => ({ ...f, group_size_min: e.target.value }))} className={input} />
            </Field>
            <Field label="Max group size">
              <input type="number" min={1} value={form.group_size_max} onChange={e => setForm(f => ({ ...f, group_size_max: e.target.value }))} className={input} />
            </Field>
          </div>

          {/* Lodging */}
          <Field label="Lodging type">
            <select value={form.lodging_type} onChange={e => setForm(f => ({ ...f, lodging_type: e.target.value }))} className={input}>
              <option value="">Select...</option>
              {['spike camp', 'tent camp', 'wall tent', 'lodge', 'ranch house', 'cabin'].map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Base price ($)">
              <input type="number" min={0} required value={form.base_price} onChange={e => setForm(f => ({ ...f, base_price: e.target.value }))} className={input} placeholder="0.00" />
            </Field>
            <Field label="Deposit amount ($)">
              <input type="number" min={0} value={form.deposit_amount} onChange={e => setForm(f => ({ ...f, deposit_amount: e.target.value }))} className={input} placeholder="0.00" />
            </Field>
          </div>

          {/* Description */}
          <Field label="Description">
            <textarea
              rows={4} value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              className={input}
              placeholder="Describe the hunt, location, what's included..."
            />
          </Field>

          {/* Optional fields */}
          <div className="grid grid-cols-2 gap-4">
            <Field label="Success rate override (%)">
              <input type="number" min={0} max={100} value={form.success_rate_override} onChange={e => setForm(f => ({ ...f, success_rate_override: e.target.value }))} className={input} placeholder="Optional" />
            </Field>
            <Field label="Unit number">
              <input type="text" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} className={input} placeholder="Optional" />
            </Field>
          </div>

          {/* Toggles */}
          <div className="space-y-3">
            {([
              ['is_combination_hunt', 'Combination hunt'],
              ['ada_accessible', 'ADA accessible'],
              ['points_required', 'Draw tag required (points needed)'],
            ] as const).map(([field, label]) => (
              <label key={field} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[field]}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.checked }))}
                  className="w-4 h-4 accent-[#1B4332]"
                />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>

          {/* Booking type */}
          <Field label="Booking type">
            <div className="grid grid-cols-2 gap-3">
              {(['instant', 'request'] as const).map(t => (
                <button
                  key={t} type="button"
                  onClick={() => setForm(f => ({ ...f, booking_type: t }))}
                  className={`py-3 rounded-lg border text-sm font-medium capitalize transition-colors ${
                    form.booking_type === t
                      ? 'bg-[#1B4332] text-white border-[#1B4332]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#1B4332]'
                  }`}
                >
                  {t === 'instant' ? 'Instant booking' : 'Request to book'}
                </button>
              ))}
            </div>
          </Field>

          {/* Cancellation policy */}
          <Field label="Cancellation policy">
            <div className="space-y-2">
              {CANCELLATION_POLICIES.map(p => (
                <label
                  key={p.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    form.cancellation_policy === p.value
                      ? 'border-[#1B4332] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancellation_policy"
                    value={p.value}
                    checked={form.cancellation_policy === p.value}
                    onChange={() => setForm(f => ({ ...f, cancellation_policy: p.value }))}
                    className="mt-0.5 accent-[#1B4332]"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{p.label}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{p.description}</div>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-2">Platform minimum: all policies must offer at least a 50% refund when hunters cancel 60+ days out.</p>
          </Field>

          <button
            type="submit" disabled={loading}
            className="w-full bg-[#1B4332] text-white py-3 rounded-lg font-medium hover:bg-[#163828] transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Create listing'}
          </button>
        </form>
      </main>
    </>
  )
}

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]'

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {children}
    </div>
  )
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${
        active ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  )
}
