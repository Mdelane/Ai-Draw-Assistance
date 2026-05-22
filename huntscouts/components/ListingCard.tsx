import Link from 'next/link'

const TERRAIN_LABELS = ['', 'Easy', 'Moderate', 'Strenuous', 'Pack-in', 'Extreme']

type ListingCardProps = {
  id: string
  title: string
  species: string[]
  states: string[]
  base_price: number
  duration_days?: number | null
  terrain_difficulty?: number | null
  booking_type: 'instant' | 'request'
  success_rate_override?: number | null
  ada_accessible?: boolean
  outfitter_profiles?: { business_name: string; success_rate?: number | null } | null
}

export default function ListingCard(l: ListingCardProps) {
  const successRate = l.success_rate_override ?? l.outfitter_profiles?.success_rate

  return (
    <Link
      href={`/listings/${l.id}`}
      className="bg-white border border-gray-200 rounded-xl p-5 hover:border-[#1B4332] hover:shadow-sm transition-all block"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-gray-900 text-base mb-1 truncate">{l.title}</div>
          <div className="text-sm text-gray-500 mb-2">
            {l.outfitter_profiles?.business_name} · {l.states?.join(', ')}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {l.species?.map(s => (
              <span key={s} className="bg-green-50 text-green-800 text-xs px-2 py-0.5 rounded-full capitalize">{s}</span>
            ))}
            {l.terrain_difficulty != null && (
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                {TERRAIN_LABELS[l.terrain_difficulty]}
              </span>
            )}
            {l.ada_accessible && (
              <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">ADA</span>
            )}
            {successRate != null && (
              <span className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full">{successRate}% success</span>
            )}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xl font-bold text-gray-900">${l.base_price?.toLocaleString()}</div>
          {l.duration_days && <div className="text-xs text-gray-400">{l.duration_days} days</div>}
          <span className={`mt-2 inline-block text-xs font-medium px-2.5 py-1 rounded-full ${
            l.booking_type === 'instant' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {l.booking_type === 'instant' ? 'Book Now' : 'Request to Book'}
          </span>
        </div>
      </div>
    </Link>
  )
}
