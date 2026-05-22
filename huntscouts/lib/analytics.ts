'use client'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function trackEvent(name: string, params?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, params)
  }
}

export const GA_EVENTS = {
  LISTING_VIEWED: 'listing_viewed',
  BOOKING_STARTED: 'booking_started',
  BOOKING_COMPLETED: 'booking_completed',
  SCOUT_QUERY_RUN: 'scout_query_run',
  SCOUT_UPGRADE_CLICKED: 'scout_upgrade_clicked',
} as const
