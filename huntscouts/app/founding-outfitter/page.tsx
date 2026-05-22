import Link from 'next/link'
import Navbar from '@/components/Navbar'

const PERKS = [
  { title: '7% commission', desc: 'vs 10% for standard outfitters. Locked in for life.' },
  { title: '"Founding Outfitter" badge', desc: 'Displayed on your profile and all listings. Permanent.' },
  { title: 'Priority in search results', desc: 'Founding outfitters rank above standard listings, all else equal.' },
  { title: 'Direct line to us', desc: 'Your feedback shapes the product. We will personally onboard you.' },
  { title: 'First access to new features', desc: 'Group booking, deposit split, repeat hunter management — you get it first.' },
]

export default function FoundingOutfitterPage() {
  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-[#1B4332] text-white py-20 px-6 text-center">
          <div className="inline-block bg-amber-400 text-amber-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-6">
            Limited — first 50 outfitters only
          </div>
          <h1 className="text-4xl font-bold mb-4">Become a Founding Outfitter</h1>
          <p className="text-green-200 text-xl mb-8 max-w-2xl mx-auto">
            Join HuntScouts early, lock in 7% commission forever, and help build the platform
            that puts your operation in front of serious hunters.
          </p>
          <Link
            href="/signup?role=outfitter&founding=1"
            className="bg-white text-[#1B4332] px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-50 transition-colors"
          >
            Apply as a Founding Outfitter
          </Link>
          <p className="text-green-300 text-sm mt-4">Free to join. No subscription fees. Commission only.</p>
        </section>

        {/* Perks */}
        <section className="max-w-3xl mx-auto px-6 py-20">
          <h2 className="text-2xl font-bold text-gray-900 text-center mb-12">What founding outfitters get</h2>
          <div className="space-y-4">
            {PERKS.map(p => (
              <div key={p.title} className="flex gap-5 bg-white border border-gray-200 rounded-2xl p-6">
                <div className="text-[#1B4332] font-bold text-xl mt-0.5">✓</div>
                <div>
                  <div className="font-semibold text-gray-900 mb-1">{p.title}</div>
                  <div className="text-gray-500 text-sm">{p.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Commission comparison */}
        <section className="bg-gray-50 py-16 px-6">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-10">The math</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center">
                <div className="text-gray-400 text-sm uppercase tracking-wide mb-2">Standard outfitter</div>
                <div className="text-4xl font-bold text-gray-900 mb-1">10%</div>
                <div className="text-gray-500 text-sm">commission per booking</div>
                <div className="mt-4 text-sm text-gray-400">$5,000 hunt = $500 fee</div>
              </div>
              <div className="bg-[#1B4332] text-white rounded-2xl p-6 text-center">
                <div className="text-green-300 text-sm uppercase tracking-wide mb-2">Founding outfitter</div>
                <div className="text-4xl font-bold mb-1">7%</div>
                <div className="text-green-200 text-sm">commission per booking</div>
                <div className="mt-4 text-sm text-green-300">$5,000 hunt = $350 fee</div>
                <div className="text-amber-300 font-medium text-sm mt-1">Save $150 per booking</div>
              </div>
            </div>
            <p className="text-center text-gray-400 text-sm mt-6">
              On 20 bookings/year at $5,000 average = <strong className="text-gray-700">$3,000 saved annually</strong>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-2xl mx-auto px-6 py-16">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">Questions</h2>
          <div className="space-y-5">
            {[
              ['Is there a fee to join?', 'No. HuntScouts is free for outfitters. We only make money when you make money.'],
              ['What makes someone a "founding" outfitter?', 'The first 50 outfitters to create a profile and publish at least one listing. We verify manually.'],
              ['Is the 7% rate locked in?', 'Yes. Founding outfitters keep 7% for as long as they use the platform, regardless of future pricing changes.'],
              ['What states do you cover?', 'CO, WY, MT, UT, ID, AZ, NV at launch. More states based on demand.'],
              ['Can I list multiple states and species?', 'Yes. Each listing can cover multiple states, species, and weapon types.'],
            ].map(([q, a]) => (
              <div key={q as string} className="border border-gray-200 rounded-xl p-5">
                <div className="font-medium text-gray-900 mb-2">{q as string}</div>
                <div className="text-gray-500 text-sm">{a as string}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-[#1B4332] text-white py-16 px-6 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to list your first hunt?</h2>
          <p className="text-green-200 mb-6">Takes about 10 minutes to set up your profile and first listing.</p>
          <Link
            href="/signup?role=outfitter&founding=1"
            className="bg-white text-[#1B4332] px-8 py-4 rounded-xl font-bold hover:bg-green-50 transition-colors"
          >
            Get started →
          </Link>
        </section>
      </main>
    </>
  )
}
