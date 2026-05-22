import Link from 'next/link'
import Navbar from '@/components/Navbar'

const STATES = ['Colorado', 'Wyoming', 'Montana', 'Utah', 'Idaho', 'Arizona', 'Nevada']
const SPECIES = ['Elk', 'Mule Deer', 'Whitetail', 'Pronghorn', 'Bear', 'Bighorn Sheep', 'Mountain Goat']

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-[#1B4332] text-white py-24 px-6 text-center">
          <h1 className="text-5xl font-bold mb-4 tracking-tight">
            Find your hunt.<br />Draw your tag.
          </h1>
          <p className="text-green-200 text-xl mb-10 max-w-xl mx-auto">
            Book guided western hunts and get AI-powered draw strategy — all in one place.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/listings"
              className="bg-white text-[#1B4332] px-7 py-3.5 rounded-xl font-semibold hover:bg-green-50 transition-colors"
            >
              Browse Guided Hunts
            </Link>
            <Link
              href="/scout"
              className="bg-transparent border-2 border-white text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-white hover:text-[#1B4332] transition-colors"
            >
              Draw Odds Tool →
            </Link>
          </div>
        </section>

        {/* Two products */}
        <section className="max-w-5xl mx-auto px-6 py-20 grid grid-cols-2 gap-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <div className="text-3xl mb-4">🏕️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Marketplace</h2>
            <p className="text-gray-500 mb-5">
              Browse and book guided hunts from licensed outfitters across the West.
              Filter by species, state, price, and more.
            </p>
            <ul className="space-y-2 text-sm text-gray-600 mb-6">
              {['Elk, mule deer, pronghorn, bear + more', 'CO, WY, MT, UT, ID, AZ, NV', 'Instant booking or request to book', 'Verified outfitters, real reviews'].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-[#1B4332]">✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/listings" className="block text-center bg-[#1B4332] text-white py-3 rounded-xl font-medium hover:bg-[#163828] transition-colors">
              Browse Hunts
            </Link>
          </div>

          <div className="bg-[#1B4332] text-white rounded-2xl p-8">
            <div className="text-3xl mb-4">🎯</div>
            <h2 className="text-2xl font-bold mb-3">Scout</h2>
            <p className="text-green-200 mb-5">
              Real draw odds data from state game agencies. AI strategy that tells you
              exactly which unit to apply for.
            </p>
            <ul className="space-y-2 text-sm text-green-200 mb-6">
              {['Draw odds table — free', 'AI conversation — Pro ($9.99/mo)', 'Multi-year trend projections', 'Apply now vs wait analysis'].map(f => (
                <li key={f} className="flex items-center gap-2"><span className="text-white">✓</span>{f}</li>
              ))}
            </ul>
            <Link href="/scout" className="block text-center bg-white text-[#1B4332] py-3 rounded-xl font-medium hover:bg-green-50 transition-colors">
              Try Scout Free
            </Link>
          </div>
        </section>

        {/* States + Species */}
        <section className="bg-gray-50 py-16 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">7 Western States</h2>
            <p className="text-gray-500 mb-8">Covering the best big game hunting in North America</p>
            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {STATES.map(s => (
                <span key={s} className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-full text-sm font-medium">{s}</span>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {SPECIES.map(s => (
                <span key={s} className="bg-[#1B4332] text-white px-4 py-2 rounded-full text-sm font-medium">{s}</span>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-6 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Ready to plan your hunt?</h2>
          <p className="text-gray-500 mb-8">Free to browse. No account required to see draw odds.</p>
          <div className="flex gap-4 justify-center">
            <Link href="/signup" className="bg-[#1B4332] text-white px-7 py-3.5 rounded-xl font-semibold hover:bg-[#163828] transition-colors">
              Create Free Account
            </Link>
            <Link href="/listings" className="bg-gray-100 text-gray-700 px-7 py-3.5 rounded-xl font-semibold hover:bg-gray-200 transition-colors">
              Browse Hunts
            </Link>
          </div>
        </section>

        <footer className="border-t border-gray-200 py-12 px-6">
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
                <Link href="/signup" className="block hover:text-gray-600">Create Account</Link>
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 mb-3">Outfitters</div>
              <div className="space-y-2 text-gray-400">
                <Link href="/outfitters" className="block hover:text-gray-600">Browse Outfitters</Link>
                <Link href="/founding-outfitter" className="block hover:text-gray-600">Founding Outfitter</Link>
                <Link href="/signup?role=outfitter" className="block hover:text-gray-600">List Your Hunts</Link>
              </div>
            </div>
            <div>
              <div className="font-semibold text-gray-700 mb-3">Company</div>
              <div className="space-y-2 text-gray-400">
                <Link href="/about" className="block hover:text-gray-600">About</Link>
                <Link href="/terms" className="block hover:text-gray-600">Terms</Link>
                <Link href="/privacy" className="block hover:text-gray-600">Privacy</Link>
                <a href="mailto:support@huntscouts.com" className="block hover:text-gray-600">support@huntscouts.com</a>
              </div>
            </div>
          </div>
          <div className="max-w-5xl mx-auto border-t border-gray-100 pt-6 text-center text-xs text-gray-400">
            © 2026 HuntScouts. All rights reserved.
          </div>
        </footer>
      </main>
    </>
  )
}
