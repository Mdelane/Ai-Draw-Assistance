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
  photos?: string[] | null
  outfitter_profiles?: { business_name: string; success_rate?: number | null } | null
}

export default function ListingCard(l: ListingCardProps) {
  const successRate = l.success_rate_override ?? l.outfitter_profiles?.success_rate
  const photo = l.photos?.[0]

  return (
    <Link
      href={`/listings/${l.id}`}
      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-[#1B4332]/30 transition-all block"
    >
      {/* Photo */}
      <div className="aspect-[4/3] bg-stone-100 overflow-hidden relative">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={l.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-stone-300 gap-2">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium">No photo yet</span>
          </div>
        )}
        {/* Booking type badge */}
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            l.booking_type === 'instant'
              ? 'bg-amber-400 text-gray-900'
              : 'bg-white/90 text-gray-700'
          }`}>
            {l.booking_type === 'instant' ? 'Book Now' : 'Request'}
          </span>
        </div>
        {successRate != null && (
          <div className="absolute top-3 right-3">
            <span className="bg-[#1B4332]/90 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              {successRate}% success
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {l.species?.map(s => (
            <span key={s} className="bg-green-50 text-green-800 text-xs px-2 py-0.5 rounded-full capitalize font-medium">{s}</span>
          ))}
          {l.terrain_difficulty != null && (
            <span className="bg-stone-100 text-stone-600 text-xs px-2 py-0.5 rounded-full">
              {TERRAIN_LABELS[l.terrain_difficulty]}
            </span>
          )}
          {l.ada_accessible && (
            <span className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">ADA</span>
          )}
        </div>

        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-1 line-clamp-2 group-hover:text-[#1B4332] transition-colors">
          {l.title}
        </h3>
        <p className="text-xs text-gray-500 mb-3">
          {l.outfitter_profiles?.business_name} · {l.states?.join(', ')}
        </p>

        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-black text-gray-900">${l.base_price?.toLocaleString()}</span>
            {l.duration_days && (
              <span className="text-xs text-gray-400 ml-1">/ {l.duration_days} days</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}
