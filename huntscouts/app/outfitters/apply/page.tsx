import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Apply as an Outfitter | HuntScouts',
  description: 'List your guided western hunts on HuntScouts. Apply to join the marketplace — founding outfitters lock in 7% commission permanently.',
}

export default function OutfitterApplyPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-16">
        {/* Hero */}
        <div className="text-center mb-12">
          <span className="inline-block bg-amber-100 text-amber-800 text-sm font-semibold px-3 py-1 rounded-full mb-4">
            Founding Outfitter — First 50 spots
          </span>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Join HuntScouts</h1>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Get in front of serious western big game hunters. Founding outfitters lock in 7% commission — permanently.
          </p>
        </div>

        {/* Two-step CTA */}
        <div className="grid grid-cols-2 gap-6 mb-14">
          {/* Step 1: Tally intake */}
          <div className="bg-white border border-gray-200 rounded-2xl p-8">
            <div className="text-[#1B4332] font-bold text-2xl mb-1">Step 1</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Tell us about your operation</h2>
            <p className="text-gray-500 text-sm mb-6">
              Takes about 3 minutes. We review every application to keep listing quality high.
            </p>
            <a
              href="https://tally.so/r/REPLACE_WITH_TALLY_FORM_ID"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full bg-[#1B4332] text-white text-center py-3 rounded-xl font-medium hover:bg-[#163828] transition-colors"
            >
              Fill out the application →
            </a>
          </div>

          {/* Step 2: Cal.com */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
            <div className="text-gray-400 font-bold text-2xl mb-1">Step 2</div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Book a 15-min onboarding call</h2>
            <p className="text-gray-500 text-sm mb-6">
              We&apos;ll walk through listing setup, photo guidelines, pricing strategy, and your first booking.
            </p>
            <a
              href="https://cal.com/huntscouts/outfitter-onboarding"
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full border-2 border-[#1B4332] text-[#1B4332] text-center py-3 rounded-xl font-medium hover:bg-green-50 transition-colors"
            >
              Book a call →
            </a>
          </div>
        </div>

        {/* Commission comparison */}
        <div className="bg-[#1B4332] text-white rounded-2xl p-8 mb-12">
          <h2 className="text-xl font-bold mb-6 text-center">Founding outfitter vs standard</h2>
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="text-amber-400 font-bold text-lg mb-1">Founding Outfitter</div>
              <div className="text-4xl font-bold mb-2">7%</div>
              <div className="text-green-200 text-sm">Commission on bookings. First 50 outfitters only — locked in permanently.</div>
              <div className="mt-4 space-y-2 text-sm text-green-100">
                {[
                  'Founding badge on your profile',
                  'Priority placement in search',
                  'Early access to new features',
                  '7% commission forever',
                ].map(p => <div key={p} className="flex gap-2"><span className="text-amber-400">✓</span>{p}</div>)}
              </div>
            </div>
            <div>
              <div className="text-green-300 font-bold text-lg mb-1">Standard Outfitter</div>
              <div className="text-4xl font-bold text-green-300 mb-2">10%</div>
              <div className="text-green-200 text-sm">Commission on bookings. Available to all outfitters after the first 50 spots are filled.</div>
              <div className="mt-4 space-y-2 text-sm text-green-200">
                {[
                  'Full listing and booking tools',
                  'Review system',
                  'Stripe payouts',
                  'Hunter messaging',
                ].map(p => <div key={p} className="flex gap-2"><span className="text-green-400">✓</span>{p}</div>)}
              </div>
            </div>
          </div>
        </div>

        {/* Earnings example */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 mb-12">
          <h2 className="text-lg font-semibold text-gray-900 mb-5">What you keep per booking</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-2 text-gray-500 font-medium">Hunt price</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Founding (7%)</th>
                  <th className="text-left py-2 text-gray-500 font-medium">Standard (10%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  [3000, 2790, 2700],
                  [5000, 4650, 4500],
                  [8000, 7440, 7200],
                  [12000, 11160, 10800],
                ].map(([price, founding, standard]) => (
                  <tr key={price}>
                    <td className="py-3 font-medium text-gray-900">${price.toLocaleString()}</td>
                    <td className="py-3 text-green-700 font-semibold">${founding.toLocaleString()}</td>
                    <td className="py-3 text-gray-600">${standard.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Already have an account */}
        <div className="text-center">
          <p className="text-gray-500 text-sm">
            Already applied?{' '}
            <Link href="/signup?role=outfitter&founding=1" className="text-[#1B4332] font-medium hover:underline">
              Create your account →
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </>
  )
}
