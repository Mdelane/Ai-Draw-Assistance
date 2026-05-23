'use client'

import { useState, useMemo } from 'react'
import type { DrawOdds } from '@/lib/types'

type Props = {
  drawOdds: DrawOdds[]
  isOTC: boolean
  species: string[]
  states: string[]
  unit: string | null
}

const DEADLINE_MAP: Record<string, string> = {
  'Colorado': 'April 1',
  'Wyoming': 'May 31',
  'Montana': 'June 1',
  'Idaho': 'December 1',
  'Utah': 'February 15',
  'Nevada': 'January 31',
  'Arizona': 'February 10',
  'New Mexico': 'March 20',
}

export default function ScoutWidget({ drawOdds, isOTC, species, states, unit }: Props) {
  const [weaponType, setWeaponType] = useState('')
  const [myPoints, setMyPoints] = useState('')

  const availableWeapons = useMemo(() => [...new Set(drawOdds.map(d => d.weapon_type))], [drawOdds])
  const latestYear = useMemo(
    () => (drawOdds.length ? Math.max(...drawOdds.map(d => d.year)) : null),
    [drawOdds]
  )

  const activeWeapon = weaponType || availableWeapons[0] || ''
  const relevantOdds = useMemo(
    () => (latestYear ? drawOdds.find(d => d.year === latestYear && d.weapon_type === activeWeapon) ?? null : null),
    [drawOdds, latestYear, activeWeapon]
  )

  const deadline = states[0] ? DEADLINE_MAP[states[0]] ?? null : null
  const pointsNum = parseInt(myPoints, 10)

  if (isOTC) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl">🎯</span>
          <div>
            <p className="font-semibold text-amber-900">Over-the-counter — no draw required</p>
            <p className="text-sm text-amber-700 mt-1">
              Purchase your tag directly from the state wildlife agency. No preference points needed.
            </p>
            {states[0] && (
              <p className="text-xs text-amber-600 mt-2">Check {states[0]} regulations for season dates.</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (drawOdds.length === 0) {
    return (
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-5">
        <p className="font-black text-gray-700 mb-1">Draw odds</p>
        <p className="text-sm text-gray-500">
          Draw odds data not yet available for this unit. Check back as we add more.
        </p>
      </div>
    )
  }

  const aboveAvg =
    relevantOdds?.avg_points_drawn != null &&
    !isNaN(pointsNum) &&
    myPoints !== '' &&
    pointsNum >= relevantOdds.avg_points_drawn
  const aboveMin =
    relevantOdds?.min_points_drawn != null &&
    !isNaN(pointsNum) &&
    myPoints !== '' &&
    pointsNum >= relevantOdds.min_points_drawn

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-black text-gray-900">Draw odds</h3>
        {latestYear && <span className="text-xs text-gray-400">{latestYear} data</span>}
      </div>

      {availableWeapons.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {availableWeapons.map(w => (
            <button
              key={w}
              onClick={() => setWeaponType(w)}
              className={`text-sm px-3 py-1 rounded-full border transition-colors capitalize ${
                activeWeapon === w
                  ? 'bg-[#1B4332] text-white border-[#1B4332]'
                  : 'border-gray-300 text-gray-500 hover:border-gray-400'
              }`}
            >
              {w}
            </button>
          ))}
        </div>
      )}

      {relevantOdds && (
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            [relevantOdds.draw_odds_percent != null ? `${relevantOdds.draw_odds_percent}%` : '—', 'Draw odds'],
            [relevantOdds.avg_points_drawn ?? '—', 'Avg pts drawn'],
            [relevantOdds.min_points_drawn ?? '—', 'Min pts drawn'],
          ].map(([val, label]) => (
            <div key={label as string} className="text-center bg-stone-50 rounded-xl p-3">
              <div className="text-xl font-black text-[#1B4332]">{val}</div>
              <div className="text-xs text-gray-500 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      <input
        type="number"
        min={0}
        value={myPoints}
        onChange={e => setMyPoints(e.target.value)}
        placeholder="Enter your preference points"
        className="w-full border border-stone-300 rounded-xl px-3 py-2 text-sm mb-3"
      />

      {myPoints !== '' && relevantOdds && (
        <div
          className={`rounded-xl p-3 text-sm ${
            aboveAvg
              ? 'bg-green-50 text-green-800'
              : aboveMin
              ? 'bg-amber-50 text-amber-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {aboveAvg
            ? `✓ Above average — strong chance of drawing this tag.`
            : aboveMin
            ? `⚠ Possible draw with ${pointsNum} pts, but not guaranteed.`
            : `✗ ${pointsNum} pts is below the historical minimum of ${relevantOdds.min_points_drawn}. Consider building more points.`}
        </div>
      )}

      {deadline && (
        <p className="text-xs text-gray-400 mt-3">Application deadline: approx. {deadline}</p>
      )}
    </div>
  )
}
