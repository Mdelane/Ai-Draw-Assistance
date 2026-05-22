import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-[#1B4332] mb-4">About HuntScouts</h1>
          <p className="text-xl text-gray-500">Built by hunters, for hunters.</p>
        </div>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-600 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">What we&apos;re building</h2>
            <p>
              HuntScouts is a two-sided platform for western big game hunting. On one side, hunters
              can find and book guided hunts from licensed outfitters across Colorado, Wyoming, Montana,
              Utah, Idaho, Arizona, and Nevada. On the other, our Scout tool gives every hunter access
              to real draw odds data — and AI strategy to put those odds to work.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">The problem we&apos;re solving</h2>
            <p>
              Western big game draws are complicated. Preference points accumulate over years, odds
              shift annually, and the difference between applying in Unit 12 vs Unit 23 can mean the
              difference between drawing in two years or waiting eight. Most hunters are flying blind —
              paying $300/year for data from services that gatekeep it, or spending hours on state
              agency PDFs that weren&apos;t designed to be useful.
            </p>
            <p className="mt-3">
              We think that&apos;s wrong. Draw odds data is public record — agencies collect it from
              hunters themselves. We FOIA it, clean it, and make it free to browse. The AI strategy
              layer sits on top and does the analysis you&apos;d otherwise pay a consultant for.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">The marketplace</h2>
            <p>
              Finding a good outfitter is hard. Most are found through word-of-mouth or forums,
              and booking is still done over the phone with a PDF contract emailed back and forth.
              HuntScouts brings the whole thing online — browse by species, state, price, and
              access type. Book instantly or submit a request. Pay a deposit securely. Leave a review.
            </p>
            <p className="mt-3">
              We charge a 10% commission on bookings — 7% for founding outfitters who join early
              and help us build the supply side.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-3">Launch states</h2>
            <p>
              We&apos;re starting with the seven best states for western big game:
              Colorado, Wyoming, Montana, Utah, Idaho, Arizona, and Nevada.
              More states will be added based on demand.
            </p>
          </section>
        </div>

        <div className="mt-14 text-center">
          <p className="text-gray-500 mb-6">Questions? We&apos;re easy to reach.</p>
          <div className="flex gap-4 justify-center">
            <Link href="mailto:support@huntscouts.com" className="bg-[#1B4332] text-white px-6 py-3 rounded-xl font-medium hover:bg-[#163828] transition-colors">
              Email us
            </Link>
            <Link href="/listings" className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors">
              Browse hunts
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}
