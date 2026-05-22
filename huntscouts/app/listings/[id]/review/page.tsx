'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'

export default function ReviewPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const listingId = params.id as string
  const bookingId = searchParams.get('booking')

  const [listing, setListing] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [body, setBody] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('listings')
      .select('title, outfitter_profiles(id, business_name)')
      .eq('id', listingId)
      .single()
      .then(({ data }) => setListing(data))
  }, [listingId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) { setError('Please select a star rating'); return }
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { error } = await supabase.from('reviews').insert({
      booking_id: bookingId,
      hunter_id: user.id,
      outfitter_id: listing.outfitter_profiles.id,
      rating,
      body: body || null,
    })

    if (error) { setError(error.message); setLoading(false); return }
    setSubmitted(true)
  }

  if (submitted) return (
    <>
      <Navbar />
      <div className="max-w-md mx-auto px-6 py-16 text-center">
        <div className="text-5xl mb-4">⭐</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Thanks for your review!</h1>
        <p className="text-gray-500 mb-6">Your feedback helps other hunters find great outfitters.</p>
        <Link href="/dashboard" className="text-[#1B4332] font-medium hover:underline">Back to dashboard</Link>
      </div>
    </>
  )

  return (
    <>
      <Navbar />
      <main className="max-w-md mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Leave a review</h1>
        {listing && <p className="text-gray-500 text-sm mb-8">{listing.title} · {listing.outfitter_profiles?.business_name}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star} type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHovered(star)}
                  onMouseLeave={() => setHovered(0)}
                  className="text-3xl transition-transform hover:scale-110"
                >
                  {star <= (hovered || rating) ? '★' : '☆'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Your review (optional)</label>
            <textarea
              rows={5}
              value={body}
              onChange={e => setBody(e.target.value)}
              placeholder="Tell other hunters about your experience..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full bg-[#1B4332] text-white py-3 rounded-lg font-medium hover:bg-[#163828] transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit review'}
          </button>
        </form>
      </main>
    </>
  )
}
