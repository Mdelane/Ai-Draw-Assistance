'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/hooks/useUser'

export default function Navbar() {
  const router = useRouter()
  const { profile, loading } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav className="bg-[#1B4332] text-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold tracking-tight">HuntScouts</Link>
          <div className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/listings" className="hover:text-green-200 transition-colors">Browse Hunts</Link>
            <Link href="/outfitters" className="hover:text-green-200 transition-colors">Outfitters</Link>
            <Link href="/scout" className="hover:text-green-200 transition-colors">Scout</Link>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4 text-sm">
          {!loading && (
            profile ? (
              <>
                <Link
                  href={profile.role === 'outfitter' ? '/outfitter/dashboard' : '/dashboard'}
                  className="hover:text-green-200 transition-colors"
                >
                  Dashboard
                </Link>
                <div className="relative group">
                  <button className="hover:text-green-200 transition-colors flex items-center gap-1">
                    {profile.full_name?.split(' ')[0] ?? 'Account'}
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white text-gray-700 rounded-xl shadow-lg border border-gray-200 py-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <Link href="/account" className="block px-4 py-2.5 text-sm hover:bg-gray-50">Account settings</Link>
                    {profile.role === 'outfitter' && (
                      <Link href="/outfitter/profile" className="block px-4 py-2.5 text-sm hover:bg-gray-50">Outfitter profile</Link>
                    )}
                    {profile.scout_subscription_status !== 'active' && (
                      <Link href="/scout/upgrade" className="block px-4 py-2.5 text-sm text-[#1B4332] font-medium hover:bg-gray-50">Upgrade to Scout Pro</Link>
                    )}
                    <hr className="my-1 border-gray-100" />
                    <button onClick={handleLogout} className="block w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-gray-50">
                      Sign out
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-green-200 transition-colors">Sign in</Link>
                <Link
                  href="/signup"
                  className="bg-white text-[#1B4332] px-4 py-1.5 rounded-lg font-medium hover:bg-green-50 transition-colors"
                >
                  Sign up
                </Link>
              </>
            )
          )}
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden" onClick={() => setMenuOpen(o => !o)}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden mt-4 pt-4 border-t border-green-700 space-y-3 text-sm">
          <Link href="/listings" className="block hover:text-green-200" onClick={() => setMenuOpen(false)}>Browse Hunts</Link>
          <Link href="/outfitters" className="block hover:text-green-200" onClick={() => setMenuOpen(false)}>Outfitters</Link>
          <Link href="/scout" className="block hover:text-green-200" onClick={() => setMenuOpen(false)}>Scout</Link>
          {profile ? (
            <>
              <Link href={profile.role === 'outfitter' ? '/outfitter/dashboard' : '/dashboard'} className="block hover:text-green-200" onClick={() => setMenuOpen(false)}>Dashboard</Link>
              <Link href="/account" className="block hover:text-green-200" onClick={() => setMenuOpen(false)}>Account</Link>
              <button onClick={handleLogout} className="block text-red-300 hover:text-red-200">Sign out</button>
            </>
          ) : (
            <>
              <Link href="/login" className="block hover:text-green-200" onClick={() => setMenuOpen(false)}>Sign in</Link>
              <Link href="/signup" className="block hover:text-green-200" onClick={() => setMenuOpen(false)}>Sign up</Link>
            </>
          )}
        </div>
      )}
    </nav>
  )
}
