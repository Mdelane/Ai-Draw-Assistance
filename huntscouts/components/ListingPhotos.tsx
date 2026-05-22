'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function ListingPhotos({ photos }: { photos: string[] }) {
  const [active, setActive] = useState(0)

  if (!photos?.length) return null

  return (
    <div className="mb-8">
      {/* Main photo */}
      <div className="relative w-full h-72 rounded-2xl overflow-hidden bg-gray-100 mb-3">
        <Image
          src={photos[active]}
          alt="Hunt listing photo"
          fill
          className="object-cover"
        />
      </div>

      {/* Thumbnails */}
      {photos.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {photos.map((url, i) => (
            <button
              key={url}
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 shrink-0 rounded-lg overflow-hidden border-2 transition-colors ${i === active ? 'border-[#1B4332]' : 'border-transparent'}`}
            >
              <Image src={url} alt="" fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
