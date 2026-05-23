import Link from 'next/link'
import Navbar from '@/components/Navbar'

export default function NotFound() {
  return (
    <>
      <Navbar />
      <div className="min-h-[70vh] flex items-center justify-center px-6">
        <div className="text-center">
          <div className="text-8xl font-black text-stone-100 mb-4">404</div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-2">Page not found</h1>
          <p className="text-gray-500 mb-8">This page doesn&apos;t exist or may have been moved.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/" className="bg-amber-400 text-black px-5 py-2.5 rounded-lg font-black hover:bg-amber-300 transition-colors">
              Go home
            </Link>
            <Link href="/listings" className="bg-stone-100 text-gray-700 border border-stone-200 px-5 py-2.5 rounded-lg font-bold hover:bg-stone-200 transition-colors">
              Browse hunts
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
