'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { isDisposableEmail } from '@/lib/auth/disposable-domains'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tosAccepted, setTosAccepted] = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'hunter' as 'hunter' | 'outfitter',
    founding: false,
  })

  useEffect(() => {
    const roleParam = searchParams.get('role')
    const foundingParam = searchParams.get('founding')
    if (roleParam === 'outfitter' || roleParam === 'hunter') {
      setForm(f => ({
        ...f,
        role: roleParam,
        founding: foundingParam === '1',
      }))
    }
  }, [searchParams])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (isDisposableEmail(form.email)) {
      setError('Please use a permanent email address — temporary email services are not allowed.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          full_name: form.fullName,
          role: form.role,
          founding_outfitter: form.founding,
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (data.user) {
      await supabase
        .from('users')
        .update({ tos_accepted_at: new Date().toISOString() })
        .eq('id', data.user.id)

      const refCode = searchParams.get('ref')
      if (refCode) {
        const { data: referrer } = await supabase
          .from('users')
          .select('id')
          .eq('ref_code', refCode)
          .single()
        if (referrer) {
          await supabase
            .from('users')
            .update({ referred_by: referrer.id })
            .eq('id', data.user.id)
        }
      }
    }

    fetch('/api/email/welcome', { method: 'POST' }).catch(() => {})
    router.push('/verify-email')
  }

  const isFoundingFlow = searchParams.get('founding') === '1'

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1B4332] flex-col justify-between p-12 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <Link href="/" className="relative text-white text-2xl font-black tracking-tight">HuntScouts</Link>
        <div className="relative">
          {isFoundingFlow ? (
            <>
              <div className="inline-flex items-center gap-2 bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-4">
                Founding Outfitter Program
              </div>
              <p className="text-4xl font-black text-white leading-tight mb-4">
                Lock in 7%<br />
                <span className="text-amber-400">forever.</span>
              </p>
              <p className="text-green-300 text-base leading-relaxed">
                The first outfitters on HuntScouts get a permanent reduced commission rate — 7% instead of 10%. This offer closes once we hit capacity.
              </p>
            </>
          ) : (
            <>
              <p className="text-4xl font-black text-white leading-tight mb-4">
                Find your hunt.<br />
                <span className="text-amber-400">Draw your tag.</span>
              </p>
              <p className="text-green-300 text-base leading-relaxed">
                Book guided western hunts and get AI-powered draw strategy from real FOIA data.
              </p>
            </>
          )}
        </div>
        <p className="relative text-green-600 text-xs">© 2026 HuntScouts</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-stone-50">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden block text-[#1B4332] text-2xl font-black mb-8">HuntScouts</Link>

          <h1 className="text-2xl font-black text-gray-900 mb-1 tracking-tight">
            {isFoundingFlow ? 'Apply as Founding Outfitter' : 'Create your account'}
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            {isFoundingFlow ? '7% commission — permanently locked in' : 'Free to join. No credit card required.'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isFoundingFlow && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
                You&apos;re signing up as a <strong>Founding Outfitter</strong> — 7% commission instead of 10%, permanently.
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Full name</label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                placeholder="John Smith"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                placeholder="you@email.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Password</label>
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                className="w-full border border-gray-200 bg-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] focus:border-transparent"
                placeholder="8+ characters"
              />
            </div>

            {!isFoundingFlow && (
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">I am a...</label>
                <div className="grid grid-cols-2 gap-3">
                  {(['hunter', 'outfitter'] as const).map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, role }))}
                      className={`py-3 rounded-xl border-2 text-sm font-bold capitalize transition-colors ${
                        form.role === role
                          ? 'bg-[#1B4332] text-white border-[#1B4332]'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-[#1B4332]'
                      }`}
                    >
                      {role === 'hunter' ? '🦌 Hunter' : '🏕️ Outfitter'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={tosAccepted}
                onChange={e => setTosAccepted(e.target.checked)}
                className="mt-0.5 accent-[#1B4332]"
              />
              <span className="text-xs text-gray-500 leading-relaxed">
                I agree to the{' '}
                <Link href="/terms" className="text-[#1B4332] underline hover:text-[#163828]">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-[#1B4332] underline hover:text-[#163828]">Privacy Policy</Link>
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !tosAccepted}
              className="w-full bg-[#1B4332] text-white py-3.5 rounded-xl text-sm font-bold hover:bg-[#163828] transition-colors disabled:opacity-50 mt-2"
            >
              {loading
                ? 'Creating account...'
                : isFoundingFlow
                  ? 'Apply as Founding Outfitter'
                  : 'Create free account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-[#1B4332] font-semibold hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
