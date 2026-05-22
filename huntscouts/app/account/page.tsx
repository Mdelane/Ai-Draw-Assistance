'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Link from 'next/link'

export default function AccountPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [fullName, setFullName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.push('/login'); return }
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(data)
      setFullName(data?.full_name ?? '')
      setLoading(false)
    })
  }, [router])

  async function saveName(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('users').update({ full_name: fullName }).eq('id', user!.id)
    setMessage({ type: 'success', text: 'Name updated.' })
    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match.' })
      return
    }
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters.' })
      return
    }
    setSaving(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) {
      setMessage({ type: 'error', text: error.message })
    } else {
      setMessage({ type: 'success', text: 'Password updated.' })
      setNewPassword('')
      setConfirmPassword('')
    }
    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

  if (loading) return (
    <>
      <Navbar />
      <div className="max-w-lg mx-auto px-6 py-16 text-center text-gray-400">Loading...</div>
    </>
  )

  return (
    <>
      <Navbar />
      <main className="max-w-lg mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Account settings</h1>

        {message && (
          <div className={`text-sm rounded-lg px-4 py-3 mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {/* Profile info */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">Profile</h2>
          <form onSubmit={saveName} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input
                type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email" value={profile?.email ?? ''} disabled
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-400"
              />
            </div>
            <button type="submit" disabled={saving} className="bg-[#1B4332] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#163828] disabled:opacity-50 transition-colors">
              Save name
            </button>
          </form>
        </section>

        {/* Password */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-4">Change password</h2>
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New password</label>
              <input
                type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)}
                minLength={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new password</label>
              <input
                type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>
            <button type="submit" disabled={saving || !newPassword} className="bg-[#1B4332] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#163828] disabled:opacity-50 transition-colors">
              Update password
            </button>
          </form>
        </section>

        {/* Scout subscription */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
          <h2 className="font-semibold text-gray-900 mb-1">Scout subscription</h2>
          {profile?.scout_subscription_status === 'active' ? (
            <div>
              <p className="text-sm text-green-700 font-medium mb-3">
                ✓ Scout Pro — active
                {profile.scout_current_period_end && (
                  <span className="text-gray-400 font-normal ml-2">
                    Renews {new Date(profile.scout_current_period_end).toLocaleDateString()}
                  </span>
                )}
              </p>
              <Link href="/account/subscription" className="text-sm text-[#1B4332] hover:underline">
                Manage or cancel subscription →
              </Link>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-500 mb-3">You&apos;re on the free plan.</p>
              <Link href="/scout/upgrade" className="bg-[#1B4332] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#163828] transition-colors">
                Upgrade to Scout Pro
              </Link>
            </div>
          )}
        </section>

        {/* Outfitter profile link */}
        {profile?.role === 'outfitter' && (
          <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
            <h2 className="font-semibold text-gray-900 mb-1">Outfitter profile</h2>
            <p className="text-sm text-gray-500 mb-3">Edit your public outfitter profile that hunters see on your listings.</p>
            <Link href="/outfitter/profile" className="text-sm text-[#1B4332] hover:underline">
              Edit outfitter profile →
            </Link>
          </section>
        )}

        {/* Danger zone */}
        <section className="border border-red-100 rounded-2xl p-6">
          <h2 className="font-semibold text-red-700 mb-1">Danger zone</h2>
          <p className="text-sm text-gray-500 mb-3">To delete your account, email us at <a href="mailto:support@huntscouts.com" className="underline">support@huntscouts.com</a>.</p>
        </section>
      </main>
    </>
  )
}
