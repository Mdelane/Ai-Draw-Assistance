'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

const CANCELLATION_POLICIES = [
  { value: 'flexible', label: 'Flexible', description: 'Full refund 60+ days out · Full refund 30–59 days · 50% refund under 30 days' },
  { value: 'moderate', label: 'Moderate (recommended)', description: 'Full refund 60+ days out · 50% refund 30–59 days · No refund under 30 days' },
  { value: 'strict', label: 'Strict', description: '50% refund 60+ days out · No refund under 60 days (platform minimum)' },
]

const SPECIES = ['elk', 'mule deer', 'whitetail', 'pronghorn', 'bear', 'bighorn sheep', 'mountain goat']
const STATES = ['CO', 'WY', 'MT', 'UT', 'ID', 'AZ', 'NV']
const WEAPON_TYPES = ['rifle', 'archery', 'muzzleloader', 'crossbow']
const TERRAIN_LABELS = ['', 'Easy', 'Moderate', 'Strenuous', 'Pack-in', 'Extreme']

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<any>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('listings')
      .select('*')
      .eq('id', listingId)
      .single()
      .then(({ data }) => {
        if (!data) { router.push('/outfitter/listings'); return }
        setForm({
          ...data,
          duration_days: data.duration_days?.toString() ?? '',
          group_size_min: data.group_size_min?.toString() ?? '1',
          group_size_max: data.group_size_max?.toString() ?? '',
          base_price: data.base_price?.toString() ?? '',
          deposit_amount: data.deposit_amount?.toString() ?? '',
          success_rate_override: data.success_rate_override?.toString() ?? '',
          terrain_difficulty: data.terrain_difficulty ?? 3,
        })
        setLoading(false)
      })
  }, [listingId, router])

  function toggleMulti(field: string, value: string) {
    setForm((f: any) => ({
      ...f,
      [field]: f[field]?.includes(value)
        ? f[field].filter((v: string) => v !== value)
        : [...(f[field] ?? []), value],
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.from('listings').update({
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
      cancellation_policy: form.cancellation_policy ?? 'moderate',
      unit: form.unit || null,
      is_active: form.is_active,
    }).eq('id', listingId)

    if (error) { setError(error.message); setSaving(false); return }
    router.push('/outfitter/listings')
  }

  if (loading || !form) return (
    <>
      <Navbar />
      <div className="max-w-2xl mx-auto px-6 py-16 text-center text-gray-400">Loading...</div>
    </>
  )

  return (
    <>
      <Navbar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Edit listing</h1>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm((f: any) => ({ ...f, is_active: e.target.checked }))}
                className="accent-[#1B4332]"
              />
              Active
            </label>
            <Link href="/outfitter/listings" className="text-gray-400 hover:text-gray-600 text-sm">Cancel</Link>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-7">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

          <Field label="Title">
            <input type="text" required value={form.title} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} className={input} />
          </Field>

          <Field label="Species">
            <div className="flex flex-wrap gap-2">
              {SPECIES.map(s => <Chip key={s} label={s} active={form.species?.includes(s)} onClick={() => toggleMulti('species', s)} />)}
            </div>
          </Field>

          <Field label="States">
            <div className="flex flex-wrap gap-2">
              {STATES.map(s => <Chip key={s} label={s} active={form.states?.includes(s)} onClick={() => toggleMulti('states', s)} />)}
            </div>
          </Field>

          <Field label="Weapon types">
            <div className="flex flex-wrap gap-2">
              {WEAPON_TYPES.map(w => <Chip key={w} label={w} active={form.weapon_types?.includes(w)} onClick={() => toggleMulti('weapon_types', w)} />)}
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Hunt style">
              <select value={form.hunt_style ?? ''} onChange={e => setForm((f: any) => ({ ...f, hunt_style: e.target.value }))} className={input}>
                <option value="">Select...</option>
                {['spot-and-stalk', 'stand hunting', 'calling', 'dog hunting'].map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
            <Field label="Access type">
              <select value={form.access_type ?? ''} onChange={e => setForm((f: any) => ({ ...f, access_type: e.target.value }))} className={input}>
                <option value="">Select...</option>
                {['public', 'private', 'high_fence', 'mixed'].map(o => <option key={o}>{o}</option>)}
              </select>
            </Field>
          </div>

          <Field label={`Terrain difficulty — ${TERRAIN_LABELS[form.terrain_difficulty]}`}>
            <input type="range" min={1} max={5} value={form.terrain_difficulty} onChange={e => setForm((f: any) => ({ ...f, terrain_difficulty: parseInt(e.target.value) }))} className="w-full accent-[#1B4332]" />
            <div className="flex justify-between text-xs text-gray-400 mt-1">
              {TERRAIN_LABELS.slice(1).map(l => <span key={l}>{l}</span>)}
            </div>
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Duration (days)">
              <input type="number" min={1} value={form.duration_days} onChange={e => setForm((f: any) => ({ ...f, duration_days: e.target.value }))} className={input} />
            </Field>
            <Field label="Min group">
              <input type="number" min={1} value={form.group_size_min} onChange={e => setForm((f: any) => ({ ...f, group_size_min: e.target.value }))} className={input} />
            </Field>
            <Field label="Max group">
              <input type="number" min={1} value={form.group_size_max} onChange={e => setForm((f: any) => ({ ...f, group_size_max: e.target.value }))} className={input} />
            </Field>
          </div>

          <Field label="Lodging type">
            <select value={form.lodging_type ?? ''} onChange={e => setForm((f: any) => ({ ...f, lodging_type: e.target.value }))} className={input}>
              <option value="">Select...</option>
              {['spike camp', 'tent camp', 'wall tent', 'lodge', 'ranch house', 'cabin'].map(o => <option key={o}>{o}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Base price ($)">
              <input type="number" min={0} required value={form.base_price} onChange={e => setForm((f: any) => ({ ...f, base_price: e.target.value }))} className={input} />
            </Field>
            <Field label="Deposit amount ($)">
              <input type="number" min={0} value={form.deposit_amount} onChange={e => setForm((f: any) => ({ ...f, deposit_amount: e.target.value }))} className={input} />
            </Field>
          </div>

          <Field label="Description">
            <textarea rows={4} value={form.description ?? ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} className={input} />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Success rate override (%)">
              <input type="number" min={0} max={100} value={form.success_rate_override} onChange={e => setForm((f: any) => ({ ...f, success_rate_override: e.target.value }))} className={input} placeholder="Optional" />
            </Field>
            <Field label="Unit number">
              <input type="text" value={form.unit ?? ''} onChange={e => setForm((f: any) => ({ ...f, unit: e.target.value }))} className={input} placeholder="Optional" />
            </Field>
          </div>

          <div className="space-y-3">
            {([['is_combination_hunt', 'Combination hunt'], ['ada_accessible', 'ADA accessible'], ['points_required', 'Draw tag required']] as const).map(([field, label]) => (
              <label key={field} className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={form[field]} onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.checked }))} className="w-4 h-4 accent-[#1B4332]" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>

          <Field label="Booking type">
            <div className="grid grid-cols-2 gap-3">
              {(['instant', 'request'] as const).map(t => (
                <button key={t} type="button" onClick={() => setForm((f: any) => ({ ...f, booking_type: t }))}
                  className={`py-3 rounded-lg border text-sm font-medium capitalize transition-colors ${form.booking_type === t ? 'bg-[#1B4332] text-white border-[#1B4332]' : 'bg-white text-gray-700 border-gray-300 hover:border-[#1B4332]'}`}>
                  {t === 'instant' ? 'Instant booking' : 'Request to book'}
                </button>
              ))}
            </div>
          </Field>

          <Field label="Cancellation policy">
            <div className="space-y-2">
              {CANCELLATION_POLICIES.map(p => (
                <label
                  key={p.value}
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${
                    (form.cancellation_policy ?? 'moderate') === p.value
                      ? 'border-[#1B4332] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="cancellation_policy"
                    value={p.value}
                    checked={(form.cancellation_policy ?? 'moderate') === p.value}
                    onChange={() => setForm((f: any) => ({ ...f, cancellation_policy: p.value }))}
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

          <button type="submit" disabled={saving} className="w-full bg-[#1B4332] text-white py-3 rounded-lg font-medium hover:bg-[#163828] transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </main>
    </>
  )
}

const input = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]'
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>{children}</div>
}
function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm capitalize transition-colors ${active ? 'bg-[#1B4332] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
      {label}
    </button>
  )
}
