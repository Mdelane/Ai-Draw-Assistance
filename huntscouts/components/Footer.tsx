import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 py-12 px-6 mt-auto">
      <div className="max-w-5xl mx-auto grid grid-cols-4 gap-8 text-sm mb-8">
        <div>
          <div className="font-bold text-gray-900 mb-3">HuntScouts</div>
          <p className="text-gray-400 text-xs leading-relaxed">The western big game marketplace and draw strategy platform.</p>
        </div>
        <div>
          <div className="font-semibold text-gray-700 mb-3">Hunters</div>
          <div className="space-y-2 text-gray-400">
            <Link href="/listings" className="block hover:text-gray-600">Browse Hunts</Link>
            <Link href="/scout" className="block hover:text-gray-600">Draw Odds (Free)</Link>
            <Link href="/scout/upgrade" className="block hover:text-gray-600">Scout Pro</Link>
            <Link href="/blog" className="block hover:text-gray-600">Strategy Blog</Link>
            <Link href="/signup" className="block hover:text-gray-600">Create Account</Link>
          </div>
        </div>
        <div>
          <div className="font-semibold text-gray-700 mb-3">Outfitters</div>
          <div className="space-y-2 text-gray-400">
            <Link href="/outfitters" className="block hover:text-gray-600">Browse Outfitters</Link>
            <Link href="/founding-outfitter" className="block hover:text-gray-600">Founding Outfitter Program</Link>
            <Link href="/outfitters/apply" className="block hover:text-gray-600">Apply as Outfitter</Link>
            <Link href="/signup?role=outfitter" className="block hover:text-gray-600">List Your Hunts</Link>
          </div>
        </div>
        <div>
          <div className="font-semibold text-gray-700 mb-3">Company</div>
          <div className="space-y-2 text-gray-400">
            <Link href="/about" className="block hover:text-gray-600">About</Link>
            <Link href="/faq" className="block hover:text-gray-600">FAQ</Link>
            <Link href="/terms" className="block hover:text-gray-600">Terms of Service</Link>
            <Link href="/privacy" className="block hover:text-gray-600">Privacy Policy</Link>
            <a href="mailto:support@huntscouts.com" className="block hover:text-gray-600">support@huntscouts.com</a>
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
        © 2026 HuntScouts. All rights reserved.
      </div>
    </footer>
  )
}
