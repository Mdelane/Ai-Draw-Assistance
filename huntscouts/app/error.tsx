'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h1>
          <p className="text-gray-500 mb-8">An unexpected error occurred.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="bg-[#1B4332] text-white px-5 py-2.5 rounded-lg font-medium hover:bg-[#163828] transition-colors"
            >
              Try again
            </button>
            <Link href="/" className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors">
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
