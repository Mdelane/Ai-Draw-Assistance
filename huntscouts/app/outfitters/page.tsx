import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Navbar from '@/components/Navbar'

const STATES = ['CO', 'WY', 'MT', 'UT', 'ID', 'AZ', 'NV']

type SearchParams = { state?: string; species?: string }

export default async function OutfittersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('outfitter_profiles')
    .select(`
      id, business_name, state, years_in_operation, bio, success_rate,
      guide_ratio, license_verified, founding_outfitter,
      listings(id, species, states, base_price)
    `)

  if (params.state) query = (query as any).eq('state', params.state)

  const { data: outfitters } = await (query as any).order('founding_outfitter', { ascending: false })

  // Filter by species client-side (listings is an array)
  const filtered = params.species
    ? outfitters?.filter((o: any) =>
        o.listings?.some((l: any) => l.species?.includes(params.species))
      )
    : outfitters

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Outfitters</h1>
            <p className="text-gray-500 mt-1">{filtered?.length ?? 0} outfitters across the West</p>
          </div>
          <Link href="/founding-outfitter" className="text-sm text-[#1B4332] hover:underline font-medium">
            Join as an outfitter →
          </Link>
        </div>

        {/* Filters */}
        <form method="get" className="flex gap-3 mb-8">
          <select name="state" defaultValue={params.state ?? ''} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]">
            <option value="">All states</option>
            {STATES.map(s => <option key={s}>{s}</option>)}
          </select>
          <select name="species" defaultValue={params.species ?? ''} className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]">
            <option value="">All species</option>
            {['elk', 'mule deer', 'whitetail', 'pronghorn', 'bear', 'bighorn sheep', 'mountain goat'].map(s => (
              <option key={s} className="capitalize">{s}</option>
            ))}
          </select>
          <button type="submit" className="bg-[#1B4332] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#163828] transition-colors">
            Filter
          </button>
          {(params.state || params.species) && (
            <Link href="/outfitters" className="text-gray-400 text-sm self-center hover:text-gray-600">Clear</Link>
          )}
        </form>

        {filtered && filtered.length > 0 ? (
          <div className="grid gap-4">
            {filtered.map((o: any) => {
              const allSpecies = [...new Set(o.listings?.flatMap((l: any) => l.species ?? []) ?? [])]
              const minPrice = o.listings?.reduce((min: number, l: any) => l.base_price < min ? l.base_price : min, Infinity)

              return (
                <div key={o.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:border-[#1B4332] transition-colors">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-semibold text-gray-900">{o.business_name}</h2>
                        {o.founding_outfitter && (
                          <span className="bg-amber-100 text-amber-800 text-xs font-medium px-2 py-0.5 rounded-full">Founding</span>
                        )}
                        {o.license_verified && (
                          <span className="bg-green-100 text-green-700 text-xs font-medium px-2 py-0.5 rounded-full">✓ Verified</span>
                        )}
                      </div>
                      <div className="text-gray-500 text-sm mb-2">
                        {o.state}
                        {o.years_in_operation && ` · ${o.years_in_operation} years`}
                        {o.guide_ratio && ` · ${o.guide_ratio} guide ratio`}
                        {o.success_rate && ` · ${o.success_rate}% success rate`}
                      </div>
                      {o.bio && <p className="text-gray-500 text-sm line-clamp-2">{o.bio}</p>}
                      {allSpecies.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {(allSpecies as string[]).slice(0, 5).map((s: string) => (
                            <span key={s} className="bg-green-50 text-green-800 text-xs px-2 py-0.5 rounded-full capitalize">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      {minPrice !== Infinity && (
                        <div className="text-lg font-bold text-gray-900">
                          From ${minPrice?.toLocaleString()}
                        </div>
                      )}
                      <div className="text-xs text-gray-400 mb-3">{o.listings?.length ?? 0} listing{o.listings?.length !== 1 ? 's' : ''}</div>
                      <Link
                        href={`/listings?outfitter=${o.id}`}
                        className="block bg-[#1B4332] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#163828] transition-colors text-center"
                      >
                        View hunts
                      </Link>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-16 text-center text-gray-400">
            No outfitters match your filters.
          </div>
        )}
      </main>
    </>
  )
}
