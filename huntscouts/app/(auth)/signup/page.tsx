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
    const { error } = await supabase.auth.signUp({
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

    router.push('/verify-email')
  }

  const isFoundingFlow = searchParams.get('founding') === '1'

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#1B4332]">HuntScouts</h1>
          {isFoundingFlow ? (
            <>
              <p className="text-gray-600 mt-2 font-medium">Founding Outfitter Application</p>
              <p className="text-gray-400 text-sm mt-1">Lock in 7% commission — forever</p>
            </>
          ) : (
            <p className="text-gray-600 mt-2">Create your account</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-5">
          {isFoundingFlow && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800">
              You&apos;re signing up as a <strong>Founding Outfitter</strong>. You&apos;ll pay 7% commission instead of 10% — permanently.
            </div>
          )}

          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
            <input
              type="text"
              required
              value={form.fullName}
              onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
            />
          </div>

          {!isFoundingFlow && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">I am a...</label>
              <div className="grid grid-cols-2 gap-3">
                {(['hunter', 'outfitter'] as const).map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, role }))}
                    className={`py-3 rounded-lg border text-sm font-medium capitalize transition-colors ${
                      form.role === role
                        ? 'bg-[#1B4332] text-white border-[#1B4332]'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-[#1B4332]'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#1B4332] text-white py-2.5 rounded-lg text-sm font-medium hover:bg-[#163828] transition-colors disabled:opacity-50"
          >
            {loading ? 'Creating account...' : isFoundingFlow ? 'Apply as Founding Outfitter' : 'Create account'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-[#1B4332] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
