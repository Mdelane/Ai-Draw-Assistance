'use client'

import { useState, useEffect, useCallback } from 'react'

export default function PhotoGallery({ photos }: { photos: string[] }) {
  const [current, setCurrent] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const prev = useCallback(() => setCurrent(i => (i - 1 + photos.length) % photos.length), [photos.length])
  const next = useCallback(() => setCurrent(i => (i + 1) % photos.length), [photos.length])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') prev()
      if (e.key === 'ArrowRight') next()
      if (e.key === 'Escape' && lightboxOpen) setLightboxOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [lightboxOpen, prev, next])

  if (photos.length === 0) {
    return (
      <div className="w-full aspect-video bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
        <div className="text-center text-gray-400">
          <div className="text-3xl font-bold text-[#1B4332] mb-2">HuntScouts</div>
          <div className="text-sm">Photos coming soon</div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      {/* Main photo */}
      <div className="relative w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden group cursor-pointer" onClick={() => setLightboxOpen(true)}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[current]} alt={`Photo ${current + 1}`} className="w-full h-full object-cover" />

        {photos.length > 1 && (
          <>
            <button
              onClick={e => { e.stopPropagation(); prev() }}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Previous photo"
            >‹</button>
            <button
              onClick={e => { e.stopPropagation(); next() }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white w-10 h-10 rounded-full flex items-center justify-center text-xl opacity-0 group-hover:opacity-100 transition-opacity"
              aria-label="Next photo"
            >›</button>
          </>
        )}

        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full">
          {current + 1} / {photos.length}
        </div>
        <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2.5 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          Click to expand
        </div>
      </div>

      {/* Thumbnail strip */}
      {photos.length > 1 && (
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
          {photos.map((photo, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`shrink-0 w-20 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                i === current ? 'border-[#1B4332]' : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={() => setLightboxOpen(false)}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white text-3xl w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-full"
            aria-label="Close"
          >×</button>

          {photos.length > 1 && (
            <>
              <button
                onClick={e => { e.stopPropagation(); prev() }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              >‹</button>
              <button
                onClick={e => { e.stopPropagation(); next() }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white w-12 h-12 rounded-full flex items-center justify-center text-2xl"
              >›</button>
            </>
          )}

          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photos[current]}
            alt={`Photo ${current + 1}`}
            className="max-w-[90vw] max-h-[90vh] object-contain"
            onClick={e => e.stopPropagation()}
          />

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {current + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  )
}
