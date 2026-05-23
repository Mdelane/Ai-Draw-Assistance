'use client'

import { useState } from 'react'
import type { ScoutPoints } from '@/lib/types'

type Projection = { plus1yr: number | null; plus2yr: number | null; plus3yr: number | null }
type Trend = 'tightening' | 'loosening' | 'stable' | 'unknown'

type SimUnit = {
  unit_number: string
  draw_odds_percent: number | null
  avg_points_drawn: number | null
  min_points_drawn: number | null
  reachable_this_year: boolean
  projection: Projection
  trend: Trend
  composite_score: number
}

type SimResult = {
  units: SimUnit[]
  isPro: boolean
  total: number
}

type CrossSellListing = {
  id: string
  title: string
  base_price: number | null
  species: string[] | null
  states: string[] | null
  photos: string[] | null
  listing_type: string | null
}

function fmt(n: number | null): string {
  if (n === null) return '—'
  return `${n.toFixed(1)}%`
}

function TrendBadge({ trend }: { trend: Trend }) {
  const map = {
    tightening: { label: '↓ Tightening', cls: 'bg-red-100 text-red-700' },
    loosening:  { label: '↑ Loosening',  cls: 'bg-green-100 text-green-700' },
    stable:     { label: '→ Stable',     cls: 'bg-stone-100 text-gray-600' },
    unknown:    { label: '— Unknown',    cls: 'bg-stone-100 text-gray-400' },
  }
  const { label, cls } = map[trend]
  return <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
}

export default function DrawSimulator({ pointsCombos, isPro }: { pointsCombos: ScoutPoints[]; isPro: boolean }) {
  const [selectedId, setSelectedId] = useState<string>(pointsCombos[0]?.id ?? '')
  const [result, setResult] = useState<SimResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [crossSellListings, setCrossSellListings] = useState<CrossSellListing[]>([])
  const [crossSellLoading, setCrossSellLoading] = useState(false)
  const [showCrossSell, setShowCrossSell] = useState(false)

  const selectedTag = pointsCombos.find(c => c.id === selectedId) ?? pointsCombos[0]

  async function runSimulation() {
    if (!selectedTag) return
    setLoading(true)
    setError(null)
    setResult(null)
    setShowCrossSell(false)
    setCrossSellListings([])

    const res = await fetch('/api/scout/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        state: selectedTag.state,
        species: selectedTag.species,
        weaponType: selectedTag.weapon_type,
        points: selectedTag.points,
        year: new Date().getFullYear(),
      }),
    })

    if (!res.ok) {
      setError('Simulation failed. Please try again.')
      setLoading(false)
      return
    }

    const data: SimResult = await res.json()
    setResult(data)
    setLoading(false)

    const allLow = data.units.length > 0 && data.units.every((u: SimUnit) => (u.draw_odds_percent ?? 0) < 5)
    if (allLow) {
      setShowCrossSell(true)
      setCrossSellLoading(true)
      const csRes = await fetch(`/api/listings/cross-sell?state=${encodeURIComponent(selectedTag.state)}&species=${encodeURIComponent(selectedTag.species)}`)
      if (csRes.ok) {
        const csData = await csRes.json()
        setCrossSellListings(csData.listings ?? [])
      }
      setCrossSellLoading(false)
    }
  }

  if (pointsCombos.length === 0) return null

  return (
    <div className="bg-stone-50 border border-stone-200 rounded-2xl overflow-hidden mb-10">
      <div className="px-6 py-5 border-b border-stone-200">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1B4332] mb-1">Draw Simulator</p>
        <h2 className="font-black tracking-tight text-gray-900 text-lg leading-tight">
          What if I wait 1, 2, or 3 more years?
        </h2>
        <p className="text-gray-500 text-sm mt-1">See how your draw odds project forward across all top units.</p>
      </div>

      <div className="px-6 py-5">
        <div className="flex gap-3 items-end mb-5">
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Tag to simulate</label>
            <select
              value={selectedId}
              onChange={e => { setSelectedId(e.target.value); setResult(null); setShowCrossSell(false); setCrossSellListings([]) }}
              className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] bg-white"
            >
              {pointsCombos.map(c => (
                <option key={c.id} value={c.id}>
                  {c.state} {c.species} · {c.weapon_type} · {c.points} pts
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={runSimulation}
            disabled={loading}
            className="bg-[#1B4332] text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-[#163828] transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {loading ? 'Running...' : 'Run Simulation →'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
        )}

        {showCrossSell && (
          <div className="mt-5 bg-red-50 border border-red-200 rounded-2xl p-5">
            <p className="text-xs font-bold uppercase tracking-widest text-red-600 mb-1">AI Analysis</p>
            <h3 className="font-black text-gray-900 tracking-tight mb-1">High point-creep risk detected</h3>
            <p className="text-sm text-gray-600 mb-4">
              All top units show under 5% draw odds with your current points. Consider a guided hunt this season while you build points.
            </p>
            {crossSellLoading ? (
              <div className="flex gap-3 mb-4">
                {[0, 1, 2].map(i => (
                  <div key={i} className="flex-1 bg-white border border-stone-200 rounded-xl p-4 animate-pulse min-w-0">
                    <div className="h-4 bg-stone-200 rounded mb-2 w-3/4" />
                    <div className="h-3 bg-stone-100 rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : crossSellListings.length > 0 ? (
              <div className="flex gap-3 overflow-x-auto pb-1 mb-4">
                {crossSellListings.map(listing => (
                  <a
                    key={listing.id}
                    href={`/listings/${listing.id}`}
                    className="bg-white border border-stone-200 rounded-xl p-4 flex flex-col gap-1 min-w-[180px] max-w-[220px] shrink-0 hover:border-stone-300 transition-colors"
                  >
                    {listing.photos && listing.photos[0] && (
                      <img
                        src={listing.photos[0]}
                        alt={listing.title}
                        className="w-full h-24 object-cover rounded-lg mb-1"
                      />
                    )}
                    <span className="text-sm font-black text-gray-900 line-clamp-2">{listing.title}</span>
                    {listing.base_price != null && (
                      <span className="text-sm text-[#1B4332] font-bold">${listing.base_price.toLocaleString()}</span>
                    )}
                  </a>
                ))}
              </div>
            ) : null}
            <a
              href={`/listings?state=${encodeURIComponent(selectedTag?.state ?? '')}&species=${encodeURIComponent(selectedTag?.species ?? '')}`}
              className="text-sm font-bold text-red-700 underline hover:text-red-900"
            >
              Browse all hunts in {selectedTag?.state} →
            </a>
          </div>
        )}

        {result && (
          <>
            <div className="overflow-x-auto rounded-xl border border-stone-200">
              <table className="w-full text-sm">
                <thead className="bg-stone-100 border-b border-stone-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Unit</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Now</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">+1yr</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">+2yr</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">+3yr</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Trend</th>
                    <th className="text-left px-4 py-3 text-xs font-bold uppercase tracking-widest text-gray-500">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 bg-white">
                  {result.units.map(u => {
                    const isDeadZone =
                      u.avg_points_drawn !== null &&
                      u.avg_points_drawn > (selectedTag?.points ?? 0) + 3 &&
                      (u.trend === 'tightening' || u.trend === 'stable')

                    return (
                      <tr key={u.unit_number} className={isDeadZone ? 'bg-red-50' : u.reachable_this_year ? 'bg-green-50' : ''}>
                        <td className="px-4 py-3 font-black text-gray-900">
                          {u.unit_number}
                          {isDeadZone && (
                            <span className="ml-2 text-xs bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                              Dead zone
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800">{fmt(u.draw_odds_percent)}</td>
                        <td className="px-4 py-3 text-gray-600">{fmt(u.projection.plus1yr)}</td>
                        <td className="px-4 py-3 text-gray-600">{fmt(u.projection.plus2yr)}</td>
                        <td className="px-4 py-3 text-gray-600">{fmt(u.projection.plus3yr)}</td>
                        <td className="px-4 py-3"><TrendBadge trend={u.trend} /></td>
                        <td className="px-4 py-3">
                          {u.reachable_this_year
                            ? <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">Reachable</span>
                            : <span className="text-xs text-gray-400">Need {u.min_points_drawn ?? '?'} pts</span>
                          }
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {!result.isPro && result.total > 3 && (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
                <p className="text-sm text-amber-800">
                  Showing 3 of {result.total} units. Upgrade to Scout Pro to see the full simulation.
                </p>
                <a
                  href="/scout/upgrade"
                  className="shrink-0 bg-amber-400 text-black text-xs font-black px-4 py-2 rounded-xl hover:bg-amber-300 transition-colors"
                >
                  Upgrade →
                </a>
              </div>
            )}

            <div className="mt-4 flex gap-5 text-xs text-gray-400">
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 inline-block" /> Reachable this year</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 inline-block" /> Point creep dead zone</span>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
