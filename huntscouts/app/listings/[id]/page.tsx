import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import PhotoGallery from '@/components/PhotoGallery'
import ShareButton from '@/components/ShareButton'
import ListingViewTracker from '@/components/ListingViewTracker'
import StickyBookingBar from '@/components/StickyBookingBar'
import ReviewsSection from './ReviewsSection'
import ScoutWidget from './ScoutWidget'
import type { Metadata } from 'next'
import type { DrawOdds } from '@/lib/types'

const TERRAIN_LABELS = ['', 'Easy', 'Moderate', 'Strenuous', 'Pack-in', 'Extreme']

const CANCELLATION_DESCRIPTIONS: Record<string, { label: string; rows: [string, string][] }> = {
  flexible: {
    label: 'Flexible',
    rows: [['60+ days out', 'Full refund'], ['30–59 days out', 'Full refund'], ['Under 30 days', '50% refund'], ['Force majeure', 'Full refund']],
  },
  moderate: {
    label: 'Moderate',
    rows: [['60+ days out', 'Full refund'], ['30–59 days out', '50% refund'], ['Under 30 days', 'No refund'], ['Force majeure', 'Full refund']],
  },
  strict: {
    label: 'Strict',
    rows: [['60+ days out', '50% refund'], ['Under 60 days', 'No refund'], ['Force majeure', 'Case by case']],
  },
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: listing } = await supabase
    .from('listings')
    .select('title, description, base_price, species, states, photos')
    .eq('id', id)
    .single()

  if (!listing) return {}
  const desc = listing.description
    ? listing.description.slice(0, 155)
    : `${listing.species?.join(', ')} hunt in ${listing.states?.join(', ')} — $${listing.base_price?.toLocaleString()}`

  return {
    title: `${listing.title} | HuntScouts`,
    description: desc,
    openGraph: {
      title: listing.title,
      description: desc,
      images: listing.photos?.[0] ? [listing.photos[0]] : [],
    },
  }
}

export default async function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: listing } = await supabase
    .from('listings')
    .select(`
      *,
      outfitter_profiles (
        id, business_name, state, years_in_operation, guide_ratio,
        response_time_hours, license_verified, bio, success_rate
      )
    `)
    .eq('id', id)
    .eq('is_active', true)
    .single()

  if (!listing) notFound()

  const outfitterId: string = listing.outfitter_profiles?.id
  const firstSpecies: string | undefined = listing.species?.[0]
  const firstState: string | undefined = listing.states?.[0]

  const [reviewsResult, drawOddsResult, similarResult, otherOutfitterResult, authResult] = await Promise.all([
    supabase
      .from('reviews')
      .select('id, rating, body, created_at, weapon_type, species, outfitter_response, users!hunter_id(full_name)')
      .eq('outfitter_id', outfitterId)
      .order('created_at', { ascending: false }),

    listing.unit && firstState && firstSpecies
      ? supabase
          .from('draw_odds')
          .select('*')
          .eq('state', firstState)
          .eq('species', firstSpecies)
          .eq('unit_number', listing.unit)
          .order('year', { ascending: false })
      : Promise.resolve({ data: [] as DrawOdds[], error: null }),

    firstSpecies
      ? supabase
          .from('listings')
          .select('id, title, base_price, species, states, photos, duration_days')
          .contains('species', [firstSpecies])
          .neq('id', id)
          .eq('is_active', true)
          .limit(3)
      : Promise.resolve({ data: [] as any[], error: null }),

    supabase
      .from('listings')
      .select('id, title, base_price, species, states, photos')
      .eq('outfitter_id', listing.outfitter_id)
      .neq('id', id)
      .eq('is_active', true)
      .limit(3),

    supabase.auth.getUser(),
  ])

  const reviews = (reviewsResult.data ?? []) as any[]
  const drawOdds = (drawOddsResult.data ?? []) as DrawOdds[]
  const similarListings = (similarResult.data ?? []) as any[]
  const otherOutfitterListings = (otherOutfitterResult.data ?? []) as any[]
  const user = authResult.data.user

  const avgRating = reviews.length
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null

  const successRate = listing.success_rate_override ?? listing.outfitter_profiles?.success_rate

  return (
    <>
      <Navbar />
      <ListingViewTracker listingId={id} title={listing.title} species={listing.species ?? []} />
      <StickyBookingBar
        listingId={id}
        title={listing.title}
        basePrice={listing.base_price}
        groupSizeMin={listing.group_size_min}
        groupSizeMax={listing.group_size_max}
        bookingType={listing.booking_type}
        isLoggedIn={!!user}
      />

      <main className="max-w-5xl mx-auto px-6 py-10">

        {/* ── Zone: hero ── */}
        <div id="zone-hero" className="mb-6">
          <div className="flex flex-wrap gap-2 mb-3">
            {listing.species?.map((s: string) => (
              <span key={s} className="bg-green-50 text-green-800 text-sm px-3 py-1 rounded-full capitalize">{s}</span>
            ))}
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <h1 className="text-3xl font-bold text-gray-900">{listing.title}</h1>
            <ShareButton title={listing.title} />
          </div>
          <p className="text-gray-500 mt-2">
            {listing.outfitter_profiles?.business_name} · {listing.states?.join(', ')}
            {avgRating && <span className="ml-3">⭐ {avgRating} ({reviews.length} reviews)</span>}
          </p>
        </div>

        {/* ── Zone: gallery ── */}
        <PhotoGallery photos={listing.photos ?? []} />

        {/* ── Zone: main 2-col ── */}
        <div className="grid grid-cols-3 gap-8">

          {/* Main column */}
          <div className="col-span-2 space-y-10">

            {/* ── Zone: details ── */}
            <div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                {([
                  ['Duration', listing.duration_days ? `${listing.duration_days} days` : '—'],
                  ['Group size', listing.group_size_max ? `${listing.group_size_min}–${listing.group_size_max} hunters` : `${listing.group_size_min}+ hunters`],
                  ['Lodging', listing.lodging_type ?? '—'],
                  ['Terrain', listing.terrain_difficulty ? TERRAIN_LABELS[listing.terrain_difficulty] : '—'],
                  ['Access', listing.access_type ?? '—'],
                  ['Weapon types', listing.weapon_types?.join(', ') ?? '—'],
                  ...(successRate ? [['Success rate', `${successRate}%`]] : []),
                  ...(listing.hunt_style ? [['Hunt style', listing.hunt_style]] : []),
                ] as [string, string][]).map(([label, value]) => (
                  <div key={label} className="bg-gray-50 rounded-xl p-4">
                    <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
                    <div className="font-medium text-gray-900 capitalize">{value}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 flex-wrap">
                {listing.ada_accessible && (
                  <span className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full">♿ ADA Accessible</span>
                )}
                {listing.is_combination_hunt && (
                  <span className="bg-purple-50 text-purple-700 text-sm px-3 py-1 rounded-full">Combination Hunt</span>
                )}
                {!listing.points_required && (
                  <span className="bg-amber-50 text-amber-700 text-sm px-3 py-1 rounded-full">OTC — No Draw Required</span>
                )}
              </div>
            </div>

            {/* ── Zone: description ── */}
            {listing.description && (
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-3">About this hunt</h2>
                <p className="text-gray-600 leading-relaxed whitespace-pre-line">{listing.description}</p>
              </div>
            )}

            {/* ── Zone: reviews ── */}
            <ReviewsSection
              reviews={reviews}
              outfitterName={listing.outfitter_profiles?.business_name ?? 'Outfitter'}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Price + CTA */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sticky top-6">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                ${listing.base_price?.toLocaleString()}
              </div>
              {listing.deposit_amount && (
                <div className="text-sm text-gray-500 mb-5">
                  ${listing.deposit_amount?.toLocaleString()} deposit to book
                </div>
              )}
              {user ? (
                <Link
                  href={`/listings/${id}/book`}
                  className="block w-full bg-[#1B4332] text-white text-center py-3 rounded-xl font-medium hover:bg-[#163828] transition-colors mb-4"
                >
                  {listing.booking_type === 'instant' ? 'Book Now' : 'Request to Book'}
                </Link>
              ) : (
                <Link
                  href={`/signup?redirect=/listings/${id}/book`}
                  className="block w-full bg-[#1B4332] text-white text-center py-3 rounded-xl font-medium hover:bg-[#163828] transition-colors mb-4"
                >
                  Sign Up to Book
                </Link>
              )}
              {listing.group_size_max && listing.group_size_max > 1 && (
                <p className="text-xs text-gray-400 text-center">
                  Groups of {listing.group_size_min}–{listing.group_size_max}
                </p>
              )}
            </div>

            {/* ── Zone: draw odds / scout widget ── */}
            <ScoutWidget
              drawOdds={drawOdds}
              isOTC={!listing.points_required}
              species={listing.species ?? []}
              states={listing.states ?? []}
              unit={listing.unit}
            />

            {/* Cancellation policy */}
            {listing.cancellation_policy && CANCELLATION_DESCRIPTIONS[listing.cancellation_policy] && (() => {
              const policy = CANCELLATION_DESCRIPTIONS[listing.cancellation_policy]
              return (
                <div className="bg-white border border-gray-200 rounded-2xl p-6">
                  <h3 className="font-semibold text-gray-900 mb-3">Cancellation — {policy.label}</h3>
                  <div className="space-y-1.5">
                    {policy.rows.map(([timing, refund]) => (
                      <div key={timing} className="flex justify-between text-sm">
                        <span className="text-gray-500">{timing}</span>
                        <span className={`font-medium ${
                          refund === 'Full refund' ? 'text-green-700'
                          : refund === 'No refund' ? 'text-red-600'
                          : 'text-amber-700'
                        }`}>{refund}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* ── Zone: outfitter card ── */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h3 className="font-semibold text-gray-900 mb-3">
                {listing.outfitter_profiles?.business_name}
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                {listing.outfitter_profiles?.years_in_operation && (
                  <div>{listing.outfitter_profiles.years_in_operation} years in operation</div>
                )}
                {listing.outfitter_profiles?.guide_ratio && (
                  <div>Guide ratio: {listing.outfitter_profiles.guide_ratio}</div>
                )}
                {listing.outfitter_profiles?.response_time_hours && (
                  <div>Responds within {listing.outfitter_profiles.response_time_hours}h</div>
                )}
                {listing.outfitter_profiles?.license_verified && (
                  <div className="text-green-700 font-medium">✓ License verified</div>
                )}
              </div>
              {listing.outfitter_profiles?.bio && (
                <p className="text-sm text-gray-500 mt-3 border-t border-gray-100 pt-3">
                  {listing.outfitter_profiles.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Zone: other outfitter listings ── */}
        {otherOutfitterListings.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold text-gray-900 mb-5">
              More from {listing.outfitter_profiles?.business_name}
            </h2>
            <div className="grid grid-cols-3 gap-5">
              {otherOutfitterListings.map((l: any) => (
                <Link
                  key={l.id}
                  href={`/listings/${l.id}`}
                  className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    {l.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={l.photos[0]}
                        alt={l.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">{l.title}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {l.species?.join(', ')} · {l.states?.join(', ')}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-2">
                      ${l.base_price?.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Zone: similar listings ── */}
        {similarListings.length > 0 && (
          <div className="mt-14">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Similar hunts you might like</h2>
            <div className="grid grid-cols-3 gap-5">
              {similarListings.map((l: any) => (
                <Link
                  key={l.id}
                  href={`/listings/${l.id}`}
                  className="group border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    {l.photos?.[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={l.photos[0]}
                        alt={l.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">
                        No photo
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-gray-900 text-sm line-clamp-2 mb-1">{l.title}</p>
                    <p className="text-xs text-gray-500 capitalize">
                      {l.species?.join(', ')} · {l.states?.join(', ')}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 mt-2">
                      ${l.base_price?.toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>
    </>
  )
}
