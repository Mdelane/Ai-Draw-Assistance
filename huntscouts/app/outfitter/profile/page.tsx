'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

const STATES = ['CO', 'WY', 'MT', 'UT', 'ID', 'AZ', 'NV']

export default function OutfitterProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingId, setExistingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    business_name: '',
    state: '',
    license_number: '',
    years_in_operation: '',
    bio: '',
    success_rate: '',
    guide_ratio: '',
    response_time_hours: '',
    instant_booking_enabled: false,
  })

  useEffect(() => {
    setLoading(true)
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('outfitter_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      if (data) {
        setExistingId(data.id)
        setForm({
          business_name: data.business_name ?? '',
          state: data.state ?? '',
          license_number: data.license_number ?? '',
          years_in_operation: data.years_in_operation?.toString() ?? '',
          bio: data.bio ?? '',
          success_rate: data.success_rate?.toString() ?? '',
          guide_ratio: data.guide_ratio ?? '',
          response_time_hours: data.response_time_hours?.toString() ?? '',
          instant_booking_enabled: data.instant_booking_enabled ?? false,
        })
      }
      setLoading(false)
    })
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      user_id: user.id,
      business_name: form.business_name,
      state: form.state,
      license_number: form.license_number || null,
      years_in_operation: form.years_in_operation ? parseInt(form.years_in_operation) : null,
      bio: form.bio || null,
      success_rate: form.success_rate ? parseFloat(form.success_rate) : null,
      guide_ratio: form.guide_ratio || null,
      response_time_hours: form.response_time_hours ? parseInt(form.response_time_hours) : null,
      instant_booking_enabled: form.instant_booking_enabled,
    }

    const { error } = existingId
      ? await supabase.from('outfitter_profiles').update(payload).eq('id', existingId)
      : await supabase.from('outfitter_profiles').insert(payload)

    if (error) { setError(error.message); setSaving(false); return }
    router.push('/outfitter/dashboard')
  }

  if (loading) return (
    <>
      <Navbar />
      <div className="max-w-lg mx-auto px-6 py-16 text-center text-gray-400">Loading...</div>
    </>
  )

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {existingId ? 'Edit profile' : 'Create outfitter profile'}
        </h1>
        <p className="text-gray-500 text-sm mb-8">This is what hunters see on your listings.</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

          <Field label="Business name">
            <input type="text" required value={form.business_name} onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))} className={input} />
          </Field>

          <Field label="Primary state">
            <select value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} required className={input}>
              <option value="">Select state</option>
              {STATES.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="License number">
              <input type="text" value={form.license_number} onChange={e => setForm(f => ({ ...f, license_number: e.target.value }))} className={input} />
            </Field>
            <Field label="Years in operation">
              <input type="number" min={0} value={form.years_in_operation} onChange={e => setForm(f => ({ ...f, years_in_operation: e.target.value }))} className={input} />
            </Field>
          </div>

          <Field label="Bio">
            <textarea rows={4} value={form.bio} onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} placeholder="Tell hunters about your operation..." className={input} />
          </Field>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Success rate (%)">
              <input type="number" min={0} max={100} value={form.success_rate} onChange={e => setForm(f => ({ ...f, success_rate: e.target.value }))} className={input} placeholder="e.g. 75" />
            </Field>
            <Field label="Guide ratio">
              <input type="text" value={form.guide_ratio} onChange={e => setForm(f => ({ ...f, guide_ratio: e.target.value }))} className={input} placeholder="1:1" />
            </Field>
            <Field label="Response time (hrs)">
              <input type="number" min={1} value={form.response_time_hours} onChange={e => setForm(f => ({ ...f, response_time_hours: e.target.value }))} className={input} placeholder="24" />
            </Field>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.instant_booking_enabled} onChange={e => setForm(f => ({ ...f, instant_booking_enabled: e.target.checked }))} className="w-4 h-4 accent-[#1B4332]" />
            <span className="text-sm text-gray-700">Enable instant booking on my listings</span>
          </label>

          <button type="submit" disabled={saving} className="w-full bg-[#1B4332] text-white py-3 rounded-lg font-medium hover:bg-[#163828] transition-colors disabled:opacity-50">
            {saving ? 'Saving...' : existingId ? 'Save changes' : 'Create profile'}
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
