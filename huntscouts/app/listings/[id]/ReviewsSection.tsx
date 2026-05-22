'use client'

import { useState, useMemo } from 'react'

type Review = {
  id: string
  rating: number
  body: string | null
  created_at: string
  weapon_type?: string | null
  species?: string | null
  outfitter_response?: string | null
  users: { full_name: string | null } | null
}

type Props = {
  reviews: Review[]
  outfitterName: string
}

const PAGE_SIZE = 5

export default function ReviewsSection({ reviews, outfitterName }: Props) {
  const [weaponFilter, setWeaponFilter] = useState<string | null>(null)
  const [speciesFilter, setSpeciesFilter] = useState<string | null>(null)
  const [sort, setSort] = useState<'recent' | 'highest' | 'lowest'>('recent')
  const [page, setPage] = useState(1)

  const weapons = useMemo(() => [...new Set(reviews.map(r => r.weapon_type).filter(Boolean) as string[])], [reviews])
  const speciesList = useMemo(() => [...new Set(reviews.map(r => r.species).filter(Boolean) as string[])], [reviews])

  const filtered = useMemo(() => {
    let out = [...reviews]
    if (weaponFilter) out = out.filter(r => r.weapon_type === weaponFilter)
    if (speciesFilter) out = out.filter(r => r.species === speciesFilter)
    if (sort === 'recent') out.sort((a, b) => b.created_at.localeCompare(a.created_at))
    else if (sort === 'highest') out.sort((a, b) => b.rating - a.rating)
    else out.sort((a, b) => a.rating - b.rating)
    return out
  }, [reviews, weaponFilter, speciesFilter, sort])

  const visible = filtered.slice(0, page * PAGE_SIZE)
  const hasMore = visible.length < filtered.length

  const dist = [5, 4, 3, 2, 1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
  }))
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0

  if (reviews.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-3">Reviews</h2>
        <p className="text-gray-400 text-sm">No reviews yet — be the first!</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-5">
        Reviews{' '}
        <span className="font-normal text-gray-400 text-base">
          · ⭐ {avgRating.toFixed(1)} ({reviews.length})
        </span>
      </h2>

      {/* Summary + distribution */}
      <div className="flex gap-8 mb-6">
        <div className="text-center shrink-0">
          <div className="text-5xl font-bold text-gray-900">{avgRating.toFixed(1)}</div>
          <div className="text-yellow-500 text-lg mt-1">
            {'★'.repeat(Math.round(avgRating))}{'☆'.repeat(5 - Math.round(avgRating))}
          </div>
          <div className="text-sm text-gray-400 mt-1">{reviews.length} reviews</div>
        </div>
        <div className="flex-1 space-y-1.5">
          {dist.map(({ star, count }) => (
            <div key={star} className="flex items-center gap-2 text-sm">
              <span className="w-2 text-gray-500 shrink-0">{star}</span>
              <div className="flex-1 bg-gray-100 rounded-full h-2">
                <div
                  className="bg-yellow-400 h-2 rounded-full"
                  style={{ width: reviews.length ? `${(count / reviews.length) * 100}%` : '0%' }}
                />
              </div>
              <span className="w-4 text-gray-400 shrink-0 text-right">{count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter pills */}
      {(weapons.length > 0 || speciesList.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {weapons.map(w => (
            <button
              key={w}
              onClick={() => { setWeaponFilter(weaponFilter === w ? null : w); setPage(1) }}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                weaponFilter === w
                  ? 'bg-[#1B4332] text-white border-[#1B4332]'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {w}
            </button>
          ))}
          {speciesList.map(s => (
            <button
              key={s}
              onClick={() => { setSpeciesFilter(speciesFilter === s ? null : s); setPage(1) }}
              className={`text-sm px-3 py-1 rounded-full border transition-colors capitalize ${
                speciesFilter === s
                  ? 'bg-[#1B4332] text-white border-[#1B4332]'
                  : 'border-gray-300 text-gray-600 hover:border-gray-400'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Sort + count */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">
          {filtered.length} review{filtered.length !== 1 ? 's' : ''}
        </span>
        <select
          value={sort}
          onChange={e => { setSort(e.target.value as typeof sort); setPage(1) }}
          className="text-sm border border-gray-300 rounded-lg px-2 py-1"
        >
          <option value="recent">Most recent</option>
          <option value="highest">Highest rated</option>
          <option value="lowest">Lowest rated</option>
        </select>
      </div>

      {/* Review cards */}
      <div className="space-y-4">
        {visible.map(r => (
          <div key={r.id} className="border border-gray-200 rounded-xl p-5">
            <div className="flex items-start justify-between mb-1">
              <div>
                <span className="font-medium text-gray-900">{r.users?.full_name ?? 'Verified Hunter'}</span>
                {(r.weapon_type || r.species) && (
                  <span className="ml-2 text-xs text-gray-400">
                    {[r.species, r.weapon_type].filter(Boolean).join(' · ')}
                  </span>
                )}
              </div>
              <span className="text-yellow-500 text-sm shrink-0">
                {'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}
              </span>
            </div>
            <p className="text-xs text-gray-400 mb-2">
              {new Date(r.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
            </p>
            {r.body && <p className="text-gray-600 text-sm leading-relaxed">{r.body}</p>}
            {r.outfitter_response && (
              <div className="mt-3 bg-gray-50 rounded-lg p-3 border-l-2 border-[#1B4332]">
                <p className="text-xs font-medium text-gray-700 mb-1">{outfitterName} responded:</p>
                <p className="text-sm text-gray-600">{r.outfitter_response}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setPage(p => p + 1)}
          className="mt-4 w-full border border-gray-300 rounded-xl py-2.5 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
        >
          Show more reviews
        </button>
      )}
    </div>
  )
}
