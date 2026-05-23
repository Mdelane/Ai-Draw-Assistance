'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const STATES = ['CO', 'WY', 'MT', 'UT', 'ID', 'AZ', 'NV']

export default function OutfitterOnboardingForm({ userId, foundingOutfitter = false }: { userId: string; foundingOutfitter?: boolean }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    business_name: '',
    state: '',
    license_number: '',
    years_in_operation: '',
    bio: '',
    guide_ratio: '',
    response_time_hours: '24',
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.from('outfitter_profiles').insert({
      user_id: userId,
      business_name: form.business_name,
      state: form.state,
      license_number: form.license_number || null,
      years_in_operation: form.years_in_operation ? parseInt(form.years_in_operation) : null,
      bio: form.bio || null,
      guide_ratio: form.guide_ratio || null,
      response_time_hours: form.response_time_hours ? parseInt(form.response_time_hours) : 24,
      founding_outfitter: foundingOutfitter,
      commission_rate: foundingOutfitter ? 0.07 : 0.10,
    })

    if (error) { setError(error.message); setSaving(false); return }
    router.push('/outfitter/listings/new')
  }

  const f = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Business name <span className="text-red-500">*</span></label>
        <input type="text" required value={form.business_name} onChange={f('business_name')} placeholder="e.g. Rocky Mountain Outfitters" className={inp} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Primary state <span className="text-red-500">*</span></label>
        <select required value={form.state} onChange={f('state')} className={inp}>
          <option value="">Select your main operating state</option>
          {STATES.map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Outfitter license #</label>
          <input type="text" value={form.license_number} onChange={f('license_number')} placeholder="Optional" className={inp} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Years in operation</label>
          <input type="number" min={0} value={form.years_in_operation} onChange={f('years_in_operation')} placeholder="e.g. 12" className={inp} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">About your operation</label>
        <textarea rows={3} value={form.bio} onChange={f('bio')} placeholder="Tell hunters what makes your operation great..." className={inp} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Guide-to-hunter ratio</label>
          <input type="text" value={form.guide_ratio} onChange={f('guide_ratio')} placeholder="e.g. 1:1 or 1:2" className={inp} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Typical response time (hrs)</label>
          <input type="number" min={1} value={form.response_time_hours} onChange={f('response_time_hours')} className={inp} />
        </div>
      </div>

      <button type="submit" disabled={saving} className="w-full bg-amber-400 text-black py-3 rounded-xl font-black hover:bg-amber-300 transition-colors disabled:opacity-50 mt-2">
        {saving ? 'Setting up your profile...' : 'Create profile & add first listing →'}
      </button>

      <p className="text-center text-xs text-gray-400">You can edit all of this later from your dashboard.</p>
    </form>
  )
}

const inp = 'w-full border border-stone-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]'
