import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import ListingCard from '@/components/ListingCard'

const SPECIES = ['elk', 'mule deer', 'whitetail', 'pronghorn', 'bear', 'bighorn sheep', 'mountain goat']
const STATES = ['CO', 'WY', 'MT', 'UT', 'ID', 'AZ', 'NV']
const WEAPON_TYPES = ['rifle', 'archery', 'muzzleloader', 'crossbow']

type SearchParams = {
  species?: string | string[]
  state?: string | string[]
  weapon?: string | string[]
  min_price?: string
  max_price?: string
  access?: string | string[]
  duration?: string
  ada?: string
  otc?: string
}

function toArray(val: string | string[] | undefined): string[] {
  if (!val) return []
  return Array.isArray(val) ? val : [val]
}

export default async function ListingsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select('id, title, species, states, base_price, duration_days, terrain_difficulty, booking_type, success_rate_override, ada_accessible, points_required, photos, outfitter_profiles(business_name, success_rate)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const species = toArray(params.species)
  const states = toArray(params.state)
  const weapons = toArray(params.weapon)
  const access = toArray(params.access)

  if (species.length) query = query.overlaps('species', species)
  if (states.length) query = query.overlaps('states', states)
  if (weapons.length) query = query.overlaps('weapon_types', weapons)
  if (params.min_price) query = query.gte('base_price', parseFloat(params.min_price))
  if (params.max_price) query = query.lte('base_price', parseFloat(params.max_price))
  if (access.length) query = query.in('access_type', access)
  if (params.ada === '1') query = query.eq('ada_accessible', true)
  if (params.otc === '1') query = query.eq('points_required', false)

  if (params.duration === '1-3') query = query.lte('duration_days', 3)
  else if (params.duration === '4-6') query = query.gte('duration_days', 4).lte('duration_days', 6)
  else if (params.duration === '7+') query = query.gte('duration_days', 7)

  const { data: listings } = await query

  return (
    <>
      <Navbar />
      <div className="flex min-h-screen">
        {/* Filters sidebar */}
        <aside className="w-64 shrink-0 border-r border-gray-200 bg-white px-5 py-8">
          <h2 className="font-black text-gray-900 mb-6 tracking-tight">Filters</h2>
          <form method="get" className="space-y-6 text-sm">
            <FilterGroup label="Species">
              {SPECIES.map(s => (
                <CheckFilter key={s} name="species" value={s} checked={species.includes(s)} label={s} />
              ))}
            </FilterGroup>

            <FilterGroup label="State">
              {STATES.map(s => (
                <CheckFilter key={s} name="state" value={s} checked={states.includes(s)} label={s} />
              ))}
            </FilterGroup>

            <FilterGroup label="Weapon type">
              {WEAPON_TYPES.map(w => (
                <CheckFilter key={w} name="weapon" value={w} checked={weapons.includes(w)} label={w} />
              ))}
            </FilterGroup>

            <FilterGroup label="Price range">
              <div className="flex gap-2">
                <input name="min_price" type="number" defaultValue={params.min_price} placeholder="Min" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
                <input name="max_price" type="number" defaultValue={params.max_price} placeholder="Max" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]" />
              </div>
            </FilterGroup>

            <FilterGroup label="Access type">
              {(['public', 'private'] as const).map(a => (
                <CheckFilter key={a} name="access" value={a} checked={access.includes(a)} label={a} />
              ))}
            </FilterGroup>

            <FilterGroup label="Duration">
              <select name="duration" defaultValue={params.duration ?? ''} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]">
                <option value="">Any</option>
                <option value="1-3">1–3 days</option>
                <option value="4-6">4–6 days</option>
                <option value="7+">7+ days</option>
              </select>
            </FilterGroup>

            <FilterGroup label="Options">
              <CheckFilter name="ada" value="1" checked={params.ada === '1'} label="ADA accessible" />
              <CheckFilter name="otc" value="1" checked={params.otc === '1'} label="OTC only (no draw)" />
            </FilterGroup>

            <button type="submit" className="w-full bg-[#1B4332] text-white py-2.5 rounded-xl text-sm font-bold hover:bg-[#163828] transition-colors">
              Apply filters
            </button>
            <Link href="/listings" className="block text-center text-gray-400 text-xs hover:text-gray-600 transition-colors">Clear all</Link>
          </form>
        </aside>

        {/* Results */}
        <main className="flex-1 px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              {listings?.length ?? 0} hunt{listings?.length !== 1 ? 's' : ''} available
            </h1>
          </div>

          {listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {listings.map((l: any) => (
                <ListingCard key={l.id} {...l} />
              ))}
            </div>
          ) : (
            <div className="bg-stone-50 border border-dashed border-stone-200 rounded-2xl p-16 text-center text-gray-400">
              No hunts match your filters.{' '}
              <Link href="/listings" className="text-[#1B4332] hover:underline font-medium">Clear filters</Link>
            </div>
          )}
        </main>
      </div>
    </>
  )
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2.5">{label}</div>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function CheckFilter({ name, value, checked, label }: { name: string; value: string; checked: boolean; label: string }) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer capitalize group">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="accent-[#1B4332] w-4 h-4 rounded" />
      <span className="text-gray-600 group-hover:text-gray-900 transition-colors">{label}</span>
    </label>
  )
}
