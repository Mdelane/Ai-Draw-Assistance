'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'

const STATES = ['CO', 'WY', 'MT', 'UT', 'ID', 'AZ', 'NV']
const SPECIES = ['elk', 'mule deer', 'whitetail', 'pronghorn', 'bear', 'bighorn sheep', 'mountain goat']
const WEAPONS = ['rifle', 'archery', 'muzzleloader', 'crossbow']
const CURRENT_YEAR = new Date().getFullYear()

export default function NewPartyPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    state: '',
    species: '',
    weapon_type: '',
    target_year: String(CURRENT_YEAR),
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const res = await fetch('/api/party', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong')
      setLoading(false)
      return
    }

    router.push('/party/' + data.id)
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-stone-50 flex items-center justify-center px-6 py-14">
        <div className="w-full max-w-lg">
          <p className="text-xs font-bold uppercase tracking-widest text-[#1B4332] mb-2">Party Draw Engine</p>
          <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-2">
            Hunt with your crew. Find a unit you can all draw.
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Enter your hunt details and invite your party. We'll find the best unit every member can draw based on the lowest points in the group.
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">State</label>
              <select
                required
                value={form.state}
                onChange={e => setForm(f => ({ ...f, state: e.target.value }))}
                className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
              >
                <option value="">Select state</option>
                {STATES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Species</label>
              <select
                required
                value={form.species}
                onChange={e => setForm(f => ({ ...f, species: e.target.value }))}
                className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
              >
                <option value="">Select species</option>
                {SPECIES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Weapon Type</label>
              <select
                required
                value={form.weapon_type}
                onChange={e => setForm(f => ({ ...f, weapon_type: e.target.value }))}
                className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
              >
                <option value="">Select weapon type</option>
                {WEAPONS.map(w => <option key={w} value={w} className="capitalize">{w}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Target Year</label>
              <select
                required
                value={form.target_year}
                onChange={e => setForm(f => ({ ...f, target_year: e.target.value }))}
                className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
              >
                <option value={String(CURRENT_YEAR)}>{CURRENT_YEAR}</option>
                <option value={String(CURRENT_YEAR + 1)}>{CURRENT_YEAR + 1}</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-400 text-black font-black py-3.5 rounded-xl hover:bg-amber-300 transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? 'Creating room...' : 'Create Hunt Room →'}
            </button>
          </form>
        </div>
      </main>
    </>
  )
}
