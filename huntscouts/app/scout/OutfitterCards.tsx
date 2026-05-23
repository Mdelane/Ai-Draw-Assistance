import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export default async function OutfitterCards({ state, species }: { state: string; species: string }) {
  const supabase = await createClient()

  const { data: listings } = await supabase
    .from('listings')
    .select('id, title, base_price, booking_type, outfitter_profiles(business_name, success_rate, license_verified)')
    .contains('states', [state])
    .contains('species', [species])
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(3)

  if (!listings?.length) return null

  return (
    <div className="mt-6 border-t border-stone-100 pt-5">
      <p className="text-xs text-stone-400 uppercase tracking-widest font-bold mb-3">
        Outfitters in {state} for {species}
      </p>
      <div className="grid grid-cols-3 gap-3">
        {listings.map((l: any) => (
          <Link
            key={l.id}
            href={`/listings/${l.id}`}
            className="bg-stone-50 border border-stone-200 rounded-2xl p-4 hover:border-[#1B4332] transition-colors block"
          >
            <div className="font-black text-gray-900 text-sm tracking-tight">{l.outfitter_profiles?.business_name}</div>
            <div className="text-gray-500 text-xs mt-0.5 line-clamp-1">{l.title}</div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[#1B4332] font-black text-sm">${l.base_price?.toLocaleString()}</span>
              {l.outfitter_profiles?.license_verified && (
                <span className="text-xs text-green-700">✓ Verified</span>
              )}
            </div>
          </Link>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">
        Verify these outfitters cover your specific unit before booking.
      </p>
    </div>
  )
}
