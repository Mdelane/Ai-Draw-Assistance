import { createClient } from '@/lib/supabase/server'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default async function InvitePage({ params }: { params: { code: string } }) {
  const supabase = await createClient()

  const { data: referrer } = await supabase
    .from('users')
    .select('full_name')
    .eq('ref_code', params.code)
    .single()

  if (!referrer) {
    return (
      <>
        <Navbar />
        <main className="max-w-lg mx-auto px-6 py-24 text-center">
          <p className="text-2xl font-black text-gray-900 mb-3">Invalid invite link</p>
          <p className="text-gray-500 text-sm mb-6">This invite link doesn&apos;t exist or has expired.</p>
          <Link href="/signup" className="bg-amber-400 text-black px-6 py-3 rounded-xl text-sm font-black hover:bg-amber-300 transition-colors">
            Sign up for free
          </Link>
        </main>
      </>
    )
  }

  const headline = referrer.full_name
    ? `${referrer.full_name} invited you to HuntScouts`
    : 'A HuntScouts member invited you'

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-stone-50">
        <div className="bg-[#1B4332] px-6 py-16 text-center">
          <h1 className="text-3xl font-black text-white leading-tight mb-4 max-w-lg mx-auto">
            {headline}
          </h1>
          <p className="text-green-300 text-base leading-relaxed max-w-md mx-auto">
            Get AI-powered western draw strategy from real FOIA data. Find units you can actually draw.
          </p>
        </div>

        <div className="max-w-md mx-auto px-6 py-12">
          <ul className="space-y-3 mb-10">
            {[
              'Free to join',
              'Real draw odds from state agencies',
              'AI strategy based on your preference points',
            ].map(item => (
              <li key={item} className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                <span className="text-[#1B4332] font-black">&#10003;</span>
                {item}
              </li>
            ))}
          </ul>

          <Link
            href={`/signup?ref=${params.code}`}
            className="block w-full text-center bg-amber-400 text-black py-3.5 rounded-xl text-sm font-black hover:bg-amber-300 transition-colors mb-4"
          >
            Create free account &rarr;
          </Link>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="text-[#1B4332] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}
