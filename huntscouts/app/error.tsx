'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">Something went wrong</h1>
          <p className="text-gray-500 mb-8">An unexpected error occurred.</p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={reset}
              className="bg-amber-400 text-black px-5 py-2.5 rounded-xl font-black hover:bg-amber-300 transition-colors"
            >
              Try again
            </button>
            <Link href="/" className="bg-stone-100 text-gray-700 border border-stone-200 px-5 py-2.5 rounded-xl font-bold hover:bg-stone-200 transition-colors">
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  )
}
