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
  const [copied, setCopied] = useState(false)
  const [smsForm, setSmsForm] = useState<{ phone: string; optIn: boolean }>({ phone: '', optIn: false })

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
      const { data: scoutProfile } = await supabase
        .from('scout_profiles')
        .select('phone_number, sms_opt_in')
        .eq('user_id', user.id)
        .single()
      setSmsForm({ phone: scoutProfile?.phone_number ?? '', optIn: scoutProfile?.sms_opt_in ?? false })
      setLoading(false)
    })
  }, [router])

  async function saveSMS(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('scout_profiles')
      .update({ phone_number: smsForm.phone || null, sms_opt_in: smsForm.optIn })
      .eq('user_id', user!.id)
    setMessage({ type: 'success', text: 'SMS preferences saved.' })
    setSaving(false)
    setTimeout(() => setMessage(null), 3000)
  }

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
        <h1 className="text-2xl font-black tracking-tight text-gray-900 mb-8">Account settings</h1>

        {message && (
          <div className={`text-sm rounded-lg px-4 py-3 mb-6 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {message.text}
          </div>
        )}

        {/* Profile info */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Profile</h2>
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
            <button type="submit" disabled={saving} className="bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-black hover:bg-amber-300 disabled:opacity-50 transition-colors">
              Save name
            </button>
          </form>
        </section>

        {/* Password */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Change password</h2>
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
            <button type="submit" disabled={saving || !newPassword} className="bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-black hover:bg-amber-300 disabled:opacity-50 transition-colors">
              Update password
            </button>
          </form>
        </section>

        {/* Scout subscription */}
        <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Scout subscription</h2>
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
              <Link href="/scout/upgrade" className="bg-amber-400 text-black px-4 py-2 rounded-lg text-sm font-black hover:bg-amber-300 transition-colors">
                Upgrade to Scout Pro
              </Link>
            </div>
          )}
        </section>

        {/* Outfitter profile link */}
        {profile?.role === 'outfitter' && (
          <section className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-1">Outfitter profile</h2>
            <p className="text-sm text-gray-500 mb-3">Edit your public outfitter profile that hunters see on your listings.</p>
            <Link href="/outfitter/profile" className="text-sm text-[#1B4332] hover:underline">
              Edit outfitter profile →
            </Link>
          </section>
        )}

        {/* SMS Deadline Alerts */}
        <section className="bg-stone-50 border border-stone-200 rounded-2xl p-6 mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-[#1B4332] mb-1">SMS Deadline Alerts</p>
          <p className="text-sm text-gray-600 mb-4">Get a text reminder 14 days before each state&apos;s application window closes.</p>
          <form onSubmit={saveSMS} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone number</label>
              <input
                type="tel"
                value={smsForm.phone}
                onChange={e => setSmsForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+1 (555) 000-0000"
                className="w-full border border-stone-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={smsForm.optIn}
                onChange={e => setSmsForm(f => ({ ...f, optIn: e.target.checked }))}
                className="accent-[#1B4332] w-4 h-4"
              />
              <span className="text-sm text-gray-700">Text me deadline reminders</span>
            </label>
            <button type="submit" disabled={saving} className="bg-[#1B4332] text-white px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-[#163828] transition-colors disabled:opacity-50">
              Save SMS preferences
            </button>
          </form>
        </section>

        {/* Refer a Hunter */}
        {profile?.ref_code && (
          <section className="bg-stone-50 border border-stone-200 rounded-2xl p-6 mb-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[#1B4332] mb-1">Refer a Hunter</p>
            <p className="text-sm text-gray-600 mb-4">Give a friend access. Get a free Scout AI query for every friend who subscribes to Scout Pro.</p>
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-2">Your invite link</p>
            <div className="flex items-stretch gap-2 mb-4">
              <div className="bg-white border border-stone-300 rounded-xl px-4 py-2.5 text-sm font-mono text-gray-700 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                {`https://huntscouts.com/invite/${profile.ref_code}`}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://huntscouts.com/invite/${profile.ref_code}`)
                  setCopied(true)
                  setTimeout(() => setCopied(false), 2000)
                }}
                className="bg-[#1B4332] text-white text-sm font-bold px-4 py-2.5 rounded-xl hover:bg-[#163828] transition-colors whitespace-nowrap"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p className="text-sm text-gray-500">
              {profile.referral_queries_earned ?? 0} free {profile.referral_queries_earned === 1 ? 'query' : 'queries'} earned
            </p>
          </section>
        )}

        {/* Danger zone */}
        <section className="border border-red-100 rounded-2xl p-6">
          <h2 className="text-xs font-bold uppercase tracking-widest text-red-600 mb-1">Danger zone</h2>
          {/* Point Guard retention warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-4">
            <p className="text-sm font-black text-amber-900 mb-1">Before you delete your account</p>
            <p className="text-xs text-amber-800 leading-relaxed">
              Deleting your account permanently removes your preference point history, Scout profile, and all saved draw strategy data. Your points tracking is gone — you cannot recover it. If you just need a break, you can cancel your Scout Pro subscription without deleting your account.
            </p>
          </div>
          <p className="text-sm text-gray-500 mb-3">To delete your account, email us at <a href="mailto:support@huntscouts.com" className="underline">support@huntscouts.com</a>.</p>
        </section>
      </main>
    </>
  )
}
