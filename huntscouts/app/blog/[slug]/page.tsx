import { getPost, getAllPosts } from '@/lib/blog'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import type { Metadata } from 'next'

export async function generateStaticParams() {
  return getAllPosts().map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  return {
    title: `${post.title} | HuntScouts Blog`,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
      images: post.coverImage ? [post.coverImage] : [],
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <Link href="/blog" className="text-sm text-gray-400 hover:text-gray-600 mb-8 block">← All articles</Link>

        <div className="mb-8">
          <span className="inline-block bg-green-50 text-green-800 text-xs font-semibold px-2.5 py-1 rounded-full mb-4">
            {post.category}
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">{post.title}</h1>
          <p className="text-gray-500 text-lg mb-5">{post.description}</p>
          <div className="flex items-center gap-3 text-sm text-gray-400 border-b border-gray-100 pb-6">
            <span>{post.author}</span>
            <span>·</span>
            <span>{new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span>·</span>
            <span>{post.readingTime}</span>
          </div>
        </div>

        <div className="prose prose-gray max-w-none
          prose-headings:font-bold prose-headings:text-gray-900
          prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
          prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3
          prose-p:text-gray-600 prose-p:leading-relaxed
          prose-a:text-[#1B4332] prose-a:underline prose-a:decoration-green-300
          prose-strong:text-gray-900
          prose-ul:text-gray-600 prose-ol:text-gray-600
          prose-li:my-1
          prose-blockquote:border-l-[#1B4332] prose-blockquote:text-gray-600">
          {/* MDX content rendered as plain text for now — wire MDX renderer in production */}
          <div className="whitespace-pre-wrap text-gray-600 leading-relaxed">{post.content}</div>
        </div>

        <div className="mt-16 pt-8 border-t border-gray-100">
          <div className="bg-[#1B4332] text-white rounded-2xl p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Get AI draw strategy for free</h3>
            <p className="text-green-200 mb-5">Check draw odds and run Scout AI queries for {new Date().getFullYear()} applications.</p>
            <Link href="/scout" className="inline-block bg-white text-[#1B4332] px-6 py-2.5 rounded-lg font-medium hover:bg-green-50 transition-colors">
              Try Scout →
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
