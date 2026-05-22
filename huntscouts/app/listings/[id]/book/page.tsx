'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import { trackEvent, GA_EVENTS } from '@/lib/analytics'

export default function BookingPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string

  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    start_date: '',
    end_date: '',
    party_size: 1,
    message: '',
  })

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('listings')
      .select('id, title, base_price, deposit_amount, duration_days, group_size_min, group_size_max, booking_type, outfitter_profiles(id, business_name)')
      .eq('id', listingId)
      .single()
      .then(({ data }) => {
        setListing(data)
        if (data) trackEvent(GA_EVENTS.BOOKING_STARTED, { listing_id: listingId, listing_title: data.title })
      })
  }, [listingId])

  useEffect(() => {
    if (form.start_date && listing?.duration_days) {
      const end = new Date(form.start_date)
      end.setDate(end.getDate() + listing.duration_days - 1)
      setForm(f => ({ ...f, end_date: end.toISOString().split('T')[0] }))
    }
  }, [form.start_date, listing])

  const totalPrice = listing ? listing.base_price * form.party_size : 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('bookings').insert({
      listing_id: listingId,
      hunter_id: user.id,
      outfitter_id: listing.outfitter_profiles.id,
      status: 'pending',
      start_date: form.start_date,
      end_date: form.end_date,
      party_size: form.party_size,
      total_price: totalPrice,
      deposit_amount: listing.deposit_amount,
      deposit_paid: false,
      booking_type: listing.booking_type,
      message_to_outfitter: form.message || null,
    })

    if (error) { setError(error.message); setLoading(false); return }
    trackEvent(GA_EVENTS.BOOKING_COMPLETED, {
      listing_id: listingId,
      listing_title: listing.title,
      value: totalPrice,
      currency: 'USD',
    })
    router.push('/dashboard/bookings?booked=1')
  }

  if (!listing) return (
    <>
      <Navbar />
      <div className="max-w-lg mx-auto px-6 py-16 text-center text-gray-400">Loading...</div>
    </>
  )

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-6 py-10">
        <Link href={`/listings/${listingId}`} className="text-sm text-gray-400 hover:text-gray-600 mb-6 block">← Back to listing</Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {listing.booking_type === 'instant' ? 'Book this hunt' : 'Request to book'}
        </h1>
        <p className="text-gray-500 text-sm mb-8">{listing.title}</p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start date</label>
              <input
                type="date" required
                min={new Date().toISOString().split('T')[0]}
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End date</label>
              <input
                type="date" required
                value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Party size ({listing.group_size_min}–{listing.group_size_max ?? '∞'})
            </label>
            <input
              type="number"
              min={listing.group_size_min}
              max={listing.group_size_max ?? undefined}
              value={form.party_size}
              onChange={e => setForm(f => ({ ...f, party_size: parseInt(e.target.value) }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message to outfitter (optional)</label>
            <textarea
              rows={3}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Any questions or special requests..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>

          {/* Price summary */}
          <div className="bg-gray-50 rounded-xl p-5 space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>${listing.base_price?.toLocaleString()} × {form.party_size} hunter{form.party_size !== 1 ? 's' : ''}</span>
              <span>${totalPrice.toLocaleString()}</span>
            </div>
            {listing.deposit_amount && (
              <div className="flex justify-between text-gray-600">
                <span>Deposit due now</span>
                <span>${listing.deposit_amount?.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-2">
              <span>Total</span>
              <span>${totalPrice.toLocaleString()}</span>
            </div>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-[#1B4332] text-white py-3 rounded-xl font-medium hover:bg-[#163828] transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : listing.booking_type === 'instant' ? 'Confirm booking' : 'Send request'}
          </button>
        </form>
      </main>
    </>
  )
}
