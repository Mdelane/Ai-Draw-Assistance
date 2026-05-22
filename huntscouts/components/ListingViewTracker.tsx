'use client'

import { useEffect } from 'react'
import { trackEvent, GA_EVENTS } from '@/lib/analytics'

export default function ListingViewTracker({ listingId, title, species }: {
  listingId: string
  title: string
  species: string[]
}) {
  useEffect(() => {
    trackEvent(GA_EVENTS.LISTING_VIEWED, {
      listing_id: listingId,
      listing_title: title,
      species: species.join(','),
    })
  }, [listingId, title, species])

  return null
}
