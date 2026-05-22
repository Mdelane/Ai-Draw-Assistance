'use client'

import { useState, useRef } from 'react'
import { uploadListingPhoto } from '@/lib/supabase/storage'

type Props = {
  listingId: string
  existingUrls?: string[]
  onUploaded: (urls: string[]) => void
}

export default function PhotoUploader({ listingId, existingUrls = [], onUploaded }: Props) {
  const [urls, setUrls] = useState<string[]>(existingUrls)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList) {
    setUploading(true)
    const uploaded: string[] = []

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      const url = await uploadListingPhoto(file, listingId)
      if (url) uploaded.push(url)
    }

    const newUrls = [...urls, ...uploaded]
    setUrls(newUrls)
    onUploaded(newUrls)
    setUploading(false)
  }

  function removePhoto(url: string) {
    const newUrls = urls.filter(u => u !== url)
    setUrls(newUrls)
    onUploaded(newUrls)
  }

  return (
    <div>
      <div className="flex flex-wrap gap-3 mb-3">
        {urls.map(url => (
          <div key={url} className="relative w-24 h-24 rounded-lg overflow-hidden group">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removePhoto(url)}
              className="absolute inset-0 bg-black/50 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
            >
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400 hover:border-[#1B4332] hover:text-[#1B4332] transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <div className="w-5 h-5 border-2 border-gray-300 border-t-[#1B4332] rounded-full animate-spin" />
          ) : (
            <span className="text-2xl">+</span>
          )}
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={e => e.target.files && handleFiles(e.target.files)}
      />
      <p className="text-xs text-gray-400">Upload photos of your hunt location, camp, and past hunts.</p>
    </div>
  )
}
