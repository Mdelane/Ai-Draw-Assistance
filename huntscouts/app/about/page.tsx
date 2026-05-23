import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About | HuntScouts',
  description: 'HuntScouts is a marketplace for guided western big game hunts, with free draw odds data and AI strategy for every hunter.',
}

export default function AboutPage() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <div
        className="relative bg-[#1B4332] text-white py-20 px-6 text-center overflow-hidden"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='600'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='600' height='600' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"), repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(255,255,255,0.015) 40px, rgba(255,255,255,0.015) 41px), repeating-linear-gradient(90deg, transparent, transparent 80px, rgba(255,255,255,0.015) 80px, rgba(255,255,255,0.015) 81px)`,
        }}
      >
        <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-4">Built by hunters, for hunters</p>
        <h1 className="text-5xl font-black tracking-tight mb-4">About HuntScouts</h1>
        <p className="text-green-200 text-lg max-w-xl mx-auto">
          Real draw odds data. Verified outfitters. AI strategy that actually helps you draw.
        </p>
      </div>

      <main className="max-w-3xl mx-auto px-6 py-16 space-y-14">

        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-[#1B4332] mb-3">What we&apos;re building</p>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-4">Two tools. One platform.</h2>
          <p className="text-gray-600 leading-relaxed">
            HuntScouts is a two-sided platform for western big game hunting. On one side, hunters
            can find and book guided hunts from licensed outfitters across Colorado, Wyoming, Montana,
            Utah, Idaho, Arizona, and Nevada. On the other, our Scout tool gives every hunter access
            to real draw odds data — and AI strategy to put those odds to work.
          </p>
        </section>

        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-[#1B4332] mb-3">The problem</p>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-4">Western draws are complicated.</h2>
          <p className="text-gray-600 leading-relaxed">
            Preference points accumulate over years, odds shift annually, and the difference between
            applying in Unit 12 vs Unit 23 can mean drawing in two years or waiting eight. Most hunters
            are flying blind — paying $300/year for data from services that gatekeep it, or spending
            hours on state agency PDFs that weren&apos;t designed to be useful.
          </p>
          <p className="text-gray-600 leading-relaxed mt-4">
            Draw odds data is public record — agencies collect it from hunters themselves. We FOIA it,
            clean it, and make it free to browse. The AI strategy layer sits on top and does the
            analysis you&apos;d otherwise pay a consultant for.
          </p>
        </section>

        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-[#1B4332] mb-3">The marketplace</p>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-4">Find and book the right outfitter.</h2>
          <p className="text-gray-600 leading-relaxed">
            Finding a good outfitter is hard. Most are found through word-of-mouth or forums,
            and booking is still done over the phone with a PDF contract emailed back and forth.
            HuntScouts brings the whole thing online — browse by species, state, price, and
            access type. Book instantly or submit a request. Pay a deposit securely. Leave a review.
          </p>
          <p className="text-gray-600 leading-relaxed mt-4">
            We charge a 10% commission on bookings — 7% for founding outfitters who join early
            and help us build the supply side.
          </p>
        </section>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { value: '7', label: 'Launch states' },
            { value: '14K+', label: 'Draw odds rows' },
            { value: '15', label: 'Years of data' },
          ].map(({ value, label }) => (
            <div key={label} className="bg-stone-50 border border-stone-200 rounded-2xl p-6 text-center">
              <div className="text-3xl font-black text-[#1B4332] mb-1">{value}</div>
              <div className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</div>
            </div>
          ))}
        </div>

        <section>
          <p className="text-xs font-bold uppercase tracking-widest text-[#1B4332] mb-3">Launch states</p>
          <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-4">The best seven states to start.</h2>
          <p className="text-gray-600 leading-relaxed">
            Colorado, Wyoming, Montana, Utah, Idaho, Arizona, and Nevada.
            More states will be added based on demand — if your state isn&apos;t listed, let us know.
          </p>
        </section>

        {/* CTA */}
        <div className="bg-[#1B4332] rounded-2xl p-10 text-center text-white">
          <h2 className="text-2xl font-black tracking-tight mb-2">Questions? We&apos;re easy to reach.</h2>
          <p className="text-green-200 mb-6">We respond within 4 business hours, Monday–Friday.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              href="mailto:support@huntscouts.com"
              className="bg-amber-400 text-black px-6 py-3 rounded-xl font-black hover:bg-amber-300 transition-colors"
            >
              Email us
            </Link>
            <Link
              href="/listings"
              className="border-2 border-white/40 text-white px-6 py-3 rounded-xl font-black hover:border-white transition-colors"
            >
              Browse hunts
            </Link>
          </div>
        </div>

      </main>
      <Footer />
    </>
  )
}
