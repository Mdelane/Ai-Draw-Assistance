import { createClient } from './client'

export async function uploadListingPhoto(file: File, listingId: string): Promise<string | null> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `listings/${listingId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('listing-photos')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) { console.error('Upload error:', error); return null }

  const { data } = supabase.storage.from('listing-photos').getPublicUrl(path)
  return data.publicUrl
}

export async function uploadReviewPhoto(file: File, reviewId: string): Promise<string | null> {
  const supabase = createClient()
  const ext = file.name.split('.').pop()
  const path = `reviews/${reviewId}/${Date.now()}.${ext}`

  const { error } = await supabase.storage
    .from('review-photos')
    .upload(path, file, { cacheControl: '3600', upsert: false })

  if (error) { console.error('Upload error:', error); return null }

  const { data } = supabase.storage.from('review-photos').getPublicUrl(path)
  return data.publicUrl
}
