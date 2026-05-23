import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | HuntScouts',
}

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <div className="bg-stone-50 border-b border-stone-200 py-12 px-6 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-[#1B4332] mb-3">Legal</p>
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-gray-400 text-sm">Last updated: May 2026</p>
      </div>
      <main className="max-w-3xl mx-auto px-6 py-16">
        <div className="space-y-8 text-gray-600 leading-relaxed text-sm">
          <section>
            <h2 className="text-base font-black text-gray-900 mb-2">What we collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account data:</strong> name, email, role (hunter or outfitter)</li>
              <li><strong>Booking data:</strong> dates, party size, payment status</li>
              <li><strong>Scout queries:</strong> state, species, points, weapon type — used to improve recommendations</li>
              <li><strong>Usage data:</strong> pages visited, features used (no cross-site tracking)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 mb-2">How we use it</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To operate the marketplace and process bookings</li>
              <li>To deliver Scout draw odds and AI strategy</li>
              <li>To send transactional emails (booking requests, confirmations, review requests)</li>
              <li>To improve the platform</li>
            </ul>
            <p className="mt-3">We do not sell your data to third parties. We do not use your data for advertising.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 mb-2">Third-party services</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Supabase</strong> — database and authentication</li>
              <li><strong>Stripe</strong> — payment processing (we never store card numbers)</li>
              <li><strong>Anthropic</strong> — AI provider for Scout conversations</li>
              <li><strong>Resend</strong> — transactional email delivery</li>
              <li><strong>Vercel</strong> — hosting</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 mb-2">Data retention</h2>
            <p>We retain your account data as long as your account is active. Booking records are retained for 7 years for tax and legal compliance. You may request deletion of your account at any time by emailing us.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 mb-2">Your rights</h2>
            <p>You may request a copy of your data or ask us to delete your account by emailing <a href="mailto:support@huntscouts.com" className="text-[#1B4332] underline">support@huntscouts.com</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 mb-2">Cookies</h2>
            <p>We use session cookies for authentication only. We do not use third-party tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-black text-gray-900 mb-2">Contact</h2>
            <p><a href="mailto:support@huntscouts.com" className="text-[#1B4332] underline">support@huntscouts.com</a></p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  )
}
