import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ | HuntScouts',
  description: 'Answers to the most common questions hunters ask before booking a guided hunt through HuntScouts.',
}

const sections = [
  {
    heading: 'About HuntScouts',
    items: [
      {
        q: 'What is HuntScouts?',
        a: 'HuntScouts is a marketplace for booking guided hunts across the western United States, and a draw strategy tool that helps hunters apply for tags using real state draw odds data. Every outfitter on the platform is verified and licensed. Every booking goes through our secure payment system.',
      },
      {
        q: 'How is HuntScouts different from just contacting an outfitter directly?',
        a: "When you book through HuntScouts, your deposit is held in escrow and only released to the outfitter after your hunt begins. Your booking agreement is documented and protected. Outfitter licenses are verified. Reviews are from confirmed bookings — not testimonials the outfitter wrote themselves.",
      },
    ],
  },
  {
    heading: 'Booking & Payment',
    items: [
      {
        q: 'How does the deposit work?',
        a: "When you book a hunt, you pay a deposit (typically 10–25% of the total hunt cost, set by the outfitter). Your deposit is held in escrow by HuntScouts via Stripe — it's not released to the outfitter until your hunt start date. This protects you if an outfitter cancels or fails to deliver what was promised.",
      },
      {
        q: 'When do I pay the remainder of the hunt cost?',
        a: 'The deposit secures your booking. The balance is paid directly to the outfitter according to their terms, which are displayed on their listing. Most outfitters collect the balance 30–60 days before the hunt, or upon arrival.',
      },
      {
        q: 'What payment methods are accepted?',
        a: 'HuntScouts accepts all major credit and debit cards via Stripe. Some outfitters may accept alternative payment for the balance portion — check their listing or ask them directly.',
      },
      {
        q: 'Is my payment information secure?',
        a: "Yes. All payments are processed by Stripe, which is PCI DSS Level 1 compliant — the highest level of payment security certification. HuntScouts never stores your card information.",
      },
    ],
  },
  {
    heading: 'Outfitters & Verification',
    items: [
      {
        q: 'How do you verify outfitters?',
        a: 'Every outfitter on HuntScouts must provide their state-issued outfitter license number before their listing goes live. We verify this against state game agency records. Outfitters also submit proof of guide licensing and liability insurance. License verification badges on listings indicate which credentials have been confirmed.',
      },
      {
        q: 'Are success rates accurate?',
        a: "Outfitters self-report their success rates, and we display them transparently. Success rates are verified over time against hunter reviews — if an outfitter consistently claims 80% success but hunters report otherwise, their listing is flagged. We recommend reading all reviews, not just the success rate number.",
      },
      {
        q: 'Can I contact the outfitter before booking?',
        a: "Yes. Every listing has a message button. You can ask questions, discuss specific dates, and confirm details before committing to a booking. Outfitters are expected to respond within their listed response time.",
      },
    ],
  },
  {
    heading: 'Cancellations & Refunds',
    items: [
      {
        q: 'What if I need to cancel my hunt?',
        a: "Your refund depends on the outfitter's cancellation policy, which is clearly displayed on their listing and in your booking confirmation. All outfitters on HuntScouts must offer at least a 50% deposit refund if you cancel 60 or more days before the hunt start date — that's a platform minimum. Some outfitters are more flexible. You accept the policy at the time of booking.",
      },
      {
        q: 'What if the outfitter cancels?',
        a: "If an outfitter cancels a confirmed booking, you receive a full deposit refund regardless of their stated cancellation policy. Outfitters who cancel bookings without cause receive a formal warning, and a second cancellation within 12 months results in their listing being suspended.",
      },
      {
        q: "What if the hunt doesn't match the listing description?",
        a: "If your hunt is materially different from what was listed — wrong species access, significantly different terrain or lodging, different guide-to-hunter ratio — contact us at support@huntscouts.com within 72 hours of your hunt start date. We review every dispute and mediate between you and the outfitter.",
      },
    ],
  },
  {
    heading: 'Scout — Draw Strategy Tool',
    items: [
      {
        q: 'What is Scout?',
        a: "Scout is HuntScouts' draw odds tool. The free tier shows a filterable table of draw odds for every unit across 7 western states, sourced directly from state game agency records. The paid tier ($9.99/month) adds an AI conversation layer that builds a personalized multi-year application strategy based on your preference points and priorities.",
      },
      {
        q: 'Where does the draw odds data come from?',
        a: "All draw odds data is sourced from state game agencies via public records requests — the same underlying data that major hunting apps use. We do not rely on any single third-party data provider, which means our data access cannot be cut off. Data is updated annually after each state publishes its draw results.",
      },
      {
        q: 'Is Scout data accurate?',
        a: "Scout displays historical draw results exactly as reported by state agencies. Draw odds are based on prior year results and historical trends. They are a guide, not a guarantee — draw odds can shift year over year based on applicant volume. Scout shows trend data so you can see if a unit's odds are tightening or loosening.",
      },
    ],
  },
  {
    heading: 'Contact & Support',
    items: [
      {
        q: 'How do I contact HuntScouts?',
        a: 'Email support@huntscouts.com. We respond within 4 business hours Monday–Friday.',
      },
    ],
  },
]

export default function FAQPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Frequently Asked Questions</h1>
          <p className="text-gray-500 text-lg">Everything you need to know before booking your first guided hunt.</p>
        </div>

        <div className="space-y-12">
          {sections.map(section => (
            <div key={section.heading}>
              <h2 className="text-sm font-semibold text-[#1B4332] uppercase tracking-wider mb-5">{section.heading}</h2>
              <div className="space-y-6">
                {section.items.map(item => (
                  <div key={item.q} className="border-b border-gray-100 pb-6 last:border-0">
                    <h3 className="font-semibold text-gray-900 mb-2">{item.q}</h3>
                    <p className="text-gray-600 leading-relaxed text-sm">{item.a}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 bg-gray-50 border border-gray-200 rounded-2xl p-8 text-center">
          <p className="text-gray-600 mb-4">Still have a question?</p>
          <a href="mailto:support@huntscouts.com" className="text-[#1B4332] font-medium hover:underline">
            support@huntscouts.com
          </a>
          <div className="mt-6 pt-6 border-t border-gray-200 flex justify-center gap-6 text-sm">
            <Link href="/listings" className="text-gray-500 hover:text-[#1B4332]">Browse hunts</Link>
            <Link href="/scout" className="text-gray-500 hover:text-[#1B4332]">Draw odds</Link>
            <Link href="/outfitters/apply" className="text-gray-500 hover:text-[#1B4332]">List your hunts</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
