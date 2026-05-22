import { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'
import { getAllPosts } from '@/lib/blog'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://huntscouts.com'
  const supabase = await createAdminClient()

  const { data: listings } = await supabase
    .from('listings')
    .select('id, created_at')
    .eq('is_active', true)

  const listingUrls = listings?.map(l => ({
    url: `${base}/listings/${l.id}`,
    lastModified: new Date(l.created_at),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  })) ?? []

  const blogPosts = getAllPosts().map(p => ({
    url: `${base}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [
    { url: base, changeFrequency: 'daily', priority: 1 },
    { url: `${base}/listings`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${base}/scout`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/outfitters`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/scout/upgrade`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/outfitters/apply`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/founding-outfitter`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/faq`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/signup`, changeFrequency: 'monthly', priority: 0.5 },
    ...listingUrls,
    ...blogPosts,
  ]
}
