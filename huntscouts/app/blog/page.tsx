import { getAllPosts } from '@/lib/blog'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — Draw Strategy & Western Hunting | HuntScouts',
  description: 'Expert advice on western big game draw strategy, unit research, and booking guided hunts across CO, WY, MT, UT, ID, AZ, and NV.',
}

const CATEGORY_COLORS: Record<string, string> = {
  Strategy: 'bg-green-50 text-green-800',
  'Draw Odds': 'bg-blue-50 text-blue-800',
  Outfitters: 'bg-amber-50 text-amber-800',
  'How-To': 'bg-purple-50 text-purple-800',
}

export default function BlogIndexPage() {
  const posts = getAllPosts()

  return (
    <>
      <Navbar />
      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Western Hunting Strategy Blog</h1>
          <p className="text-gray-500 text-lg">Draw odds breakdowns, unit comparisons, and outfitter advice from HuntScouts.</p>
        </div>

        {posts.length === 0 ? (
          <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-16 text-center text-gray-400">
            Articles coming soon.
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map(post => (
              <Link key={post.slug} href={`/blog/${post.slug}`} className="group block bg-white border border-gray-200 rounded-2xl p-7 hover:border-[#1B4332] transition-colors">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[post.category] ?? 'bg-gray-100 text-gray-700'}`}>
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-400">{post.readingTime}</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-[#1B4332] transition-colors">{post.title}</h2>
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{post.description}</p>
                  </div>
                  <div className="text-xs text-gray-400 shrink-0 mt-1">
                    {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
