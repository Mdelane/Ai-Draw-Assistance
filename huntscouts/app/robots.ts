import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'https://huntscouts.com'
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/listings', '/listings/*', '/scout'],
        disallow: ['/dashboard', '/outfitter', '/admin', '/api'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  }
}
