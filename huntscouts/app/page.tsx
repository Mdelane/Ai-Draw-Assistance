import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

const STATES = ['Colorado', 'Wyoming', 'Montana', 'Utah', 'Idaho', 'Arizona', 'Nevada']
const SPECIES = ['Elk', 'Mule Deer', 'Whitetail', 'Pronghorn', 'Bear', 'Bighorn Sheep', 'Mountain Goat']

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Browse guided hunts',
    body: 'Search listings by species, state, weapon type, and budget. Every outfitter is verified.',
  },
  {
    step: '02',
    title: 'Check your draw odds',
    body: 'Pull real FOIA data for any unit. See average points, trend direction, and how you stack up.',
  },
  {
    step: '03',
    title: 'Get your AI strategy',
    body: 'Scout Pro analyzes your points and history to tell you exactly which unit to apply for — and when.',
  },
]

const STATS = [
  { value: '7', label: 'Western states' },
  { value: '40+', label: 'Species & seasons' },
  { value: '100%', label: 'FOIA-sourced data' },
  { value: 'Free', label: 'Draw odds table' },
]

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>

        {/* ── Hero ── */}
        <section className="relative bg-[#1B4332] text-white overflow-hidden">
          {/* Subtle topographic pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          {/* Gradient fade bottom */}
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#163828] to-transparent" />

          <div className="relative max-w-5xl mx-auto px-6 py-28 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-green-200 text-xs font-semibold uppercase tracking-widest px-4 py-2 rounded-full mb-8">
              Western Big Game · CO · WY · MT · UT · ID · AZ · NV
            </div>
            <h1 className="text-6xl font-black tracking-tight leading-[1.08] mb-6">
              Find your hunt.<br />
              <span className="text-amber-400">Draw your tag.</span>
            </h1>
            <p className="text-green-200 text-xl mb-10 max-w-lg mx-auto leading-relaxed">
              Book guided western hunts and get AI-powered draw strategy — all in one place.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/listings"
                className="bg-amber-400 text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-amber-300 transition-colors text-base shadow-lg shadow-amber-900/20"
              >
                Browse Guided Hunts
              </Link>
              <Link
                href="/scout"
                className="bg-white/10 border border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-colors text-base"
              >
                Draw Odds Tool →
              </Link>
            </div>
          </div>
        </section>

        {/* ── Stats bar ── */}
        <section className="bg-[#163828] border-b border-green-900">
          <div className="max-w-5xl mx-auto px-6 py-5 grid grid-cols-4 divide-x divide-green-800">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center px-4">
                <div className="text-2xl font-black text-amber-400">{value}</div>
                <div className="text-xs text-green-400 mt-0.5 uppercase tracking-wide">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Two products ── */}
        <section className="max-w-5xl mx-auto px-6 py-20 grid grid-cols-2 gap-6">
          {/* Marketplace */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-5 text-2xl">🏕️</div>
            <h2 className="text-2xl font-black text-gray-900 mb-3 tracking-tight">Marketplace</h2>
            <p className="text-gray-500 mb-6 leading-relaxed">
              Browse and book guided hunts from licensed outfitters across the West.
              Filter by species, state, price, and more.
            </p>
            <ul className="space-y-2.5 text-sm text-gray-600 mb-8">
              {[
                'Elk, mule deer, pronghorn, bear + more',
                'CO, WY, MT, UT, ID, AZ, NV',
                'Instant booking or request to book',
                'Verified outfitters, real reviews',
              ].map(f => (
                <li key={f} className="flex items-center gap-2.5">
                  <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/listings"
              className="block text-center bg-[#1B4332] text-white py-3.5 rounded-xl font-semibold hover:bg-[#163828] transition-colors"
            >
              Browse Guided Hunts
            </Link>
          </div>

          {/* Scout */}
          <div className="bg-[#1B4332] text-white rounded-2xl p-8 shadow-sm relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='1' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E")`,
              }}
            />
            <div className="relative">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-5 text-2xl">🎯</div>
              <h2 className="text-2xl font-black mb-3 tracking-tight">Scout</h2>
              <p className="text-green-200 mb-6 leading-relaxed">
                Real draw odds from state game agencies. AI strategy that tells you
                exactly which unit to apply for.
              </p>
              <ul className="space-y-2.5 text-sm text-green-200 mb-8">
                {[
                  'Draw odds table — free forever',
                  'AI conversation — Pro ($9.99/mo)',
                  'Multi-year trend projections',
                  'Apply now vs. wait analysis',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2.5">
                    <span className="w-5 h-5 bg-amber-400/20 text-amber-400 rounded-full flex items-center justify-center text-xs font-bold shrink-0">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/scout"
                className="block text-center bg-amber-400 text-gray-900 py-3.5 rounded-xl font-bold hover:bg-amber-300 transition-colors"
              >
                Try Scout Free
              </Link>
            </div>
          </div>
        </section>

        {/* ── How it works ── */}
        <section className="bg-stone-50 border-y border-stone-200 py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-bold uppercase tracking-widest text-[#1B4332] mb-3">Simple process</p>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">How HuntScouts works</h2>
            </div>
            <div className="grid grid-cols-3 gap-8">
              {HOW_IT_WORKS.map(({ step, title, body }) => (
                <div key={step} className="text-center">
                  <div className="w-14 h-14 bg-[#1B4332] text-white rounded-2xl flex items-center justify-center mx-auto mb-5 text-xl font-black">
                    {step}
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 text-lg">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── States + Species ── */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-[#1B4332] mb-3">Coverage</p>
            <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">7 Western States</h2>
            <p className="text-gray-500 mb-10">The best big game hunting in North America</p>
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              {STATES.map(s => (
                <span
                  key={s}
                  className="bg-white border-2 border-gray-200 text-gray-700 px-5 py-2.5 rounded-full text-sm font-semibold hover:border-[#1B4332] hover:text-[#1B4332] transition-colors cursor-default"
                >
                  {s}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap justify-center gap-2.5">
              {SPECIES.map(s => (
                <span
                  key={s}
                  className="bg-[#1B4332] text-white px-4 py-2 rounded-full text-sm font-medium"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="bg-[#1B4332] py-20 px-6 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="relative max-w-2xl mx-auto">
            <h2 className="text-4xl font-black text-white mb-4 tracking-tight">
              Ready to plan your hunt?
            </h2>
            <p className="text-green-300 text-lg mb-10">
              Free to browse. No account required to see draw odds.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/signup"
                className="bg-amber-400 text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-amber-300 transition-colors text-base shadow-lg"
              >
                Create Free Account
              </Link>
              <Link
                href="/listings"
                className="bg-white/10 border border-white/30 text-white px-8 py-4 rounded-xl font-semibold hover:bg-white/20 transition-colors text-base"
              >
                Browse Hunts
              </Link>
            </div>
          </div>
        </section>

        <Footer />
      </main>
    </>
  )
}
