'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Props = {
  listingId: string
  title: string
  basePrice: number
  groupSizeMin: number
  groupSizeMax: number | null
  bookingType: 'instant' | 'request'
  isLoggedIn: boolean
}

export default function StickyBookingBar({
  listingId, title, basePrice, groupSizeMin, groupSizeMax, bookingType, isLoggedIn,
}: Props) {
  const [visible, setVisible] = useState(false)
  const [partySize, setPartySize] = useState(groupSizeMin)

  useEffect(() => {
    const hero = document.getElementById('zone-hero')
    if (!hero) return
    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), { threshold: 0 })
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  if (!visible) return null

  const max = groupSizeMax ?? 20
  const total = basePrice * partySize
  const bookHref = isLoggedIn
    ? `/listings/${listingId}/book`
    : `/signup?redirect=/listings/${listingId}/book`

  return (
    <div className="hidden md:flex fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm px-6 py-3 items-center gap-6">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{title}</p>
        <p className="text-sm text-gray-500">${basePrice.toLocaleString()} / hunter</p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <label className="text-sm text-gray-600 whitespace-nowrap">Party size</label>
        <input
          type="number"
          min={groupSizeMin}
          max={max}
          value={partySize}
          onChange={e => setPartySize(Math.max(groupSizeMin, Math.min(max, Number(e.target.value))))}
          className="w-16 border border-gray-300 rounded-lg px-2 py-1 text-sm text-center"
        />
      </div>

      <div className="shrink-0 text-right">
        <div className="font-bold text-gray-900">${total.toLocaleString()}</div>
        <div className="text-xs text-gray-400">total</div>
      </div>

      <Link
        href={bookHref}
        className="shrink-0 bg-[#1B4332] text-white px-6 py-2 rounded-xl font-medium text-sm hover:bg-[#163828] transition-colors"
      >
        {bookingType === 'instant' ? 'Book Now' : 'Request to Book'}
      </Link>
    </div>
  )
}
