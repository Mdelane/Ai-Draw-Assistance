import { NextRequest, NextResponse } from 'next/server'
import { requireUser, isScoutPro } from '@/lib/auth/requireUser'
import { scoreUnits } from '@/lib/scout/score'

export async function POST(req: NextRequest) {
  let userCtx: Awaited<ReturnType<typeof requireUser>>
  try {
    userCtx = await requireUser()
  } catch (res) {
    return res as NextResponse
  }

  const paid = isScoutPro(userCtx.profile as any)

  const { state, species, weaponType, points, year } = await req.json()

  if (!state || !species || !weaponType || points == null || !year) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const weights = { drawOdds: 3, trophyQuality: 3, publicLandAccess: 3, pointsBurnWillingness: 3 }
  const units = await scoreUnits(state, species, weaponType, points, year, weights)

  // Free users see top 3 only — full list is a Pro feature
  const visibleUnits = paid ? units : units.slice(0, 3)

  return NextResponse.json({ units: visibleUnits, isPro: paid, total: units.length })
}
