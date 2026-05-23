import { createAdminClient } from '@/lib/supabase/server'

export type PriorityWeights = {
  drawOdds: number           // 1–5
  trophyQuality: number      // 1–5
  publicLandAccess: number   // 1–5
  pointsBurnWillingness: number // 1–5 (high = ok to burn points on hard units)
}

export type ScoredUnit = {
  unit_number: string
  draw_odds_percent: number | null
  avg_points_drawn: number | null
  min_points_drawn: number | null
  total_applicants: number | null
  successful_draws: number | null
  composite_score: number
  reachable_this_year: boolean
  // Unit context (null when unit_context table not yet populated)
  trophy_quality: number | null
  public_land_percent: number | null
  access_type: string | null
  terrain: string | null
  notes: string | null
  projection: {
    plus1yr: number | null
    plus2yr: number | null
    plus3yr: number | null
  }
  trend: 'tightening' | 'loosening' | 'stable' | 'unknown'
}

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0.5
  return Math.max(0, Math.min(1, (value - min) / (max - min)))
}

export async function scoreUnits(
  state: string,
  species: string,
  weaponType: string,
  points: number,
  year: number,
  weights: PriorityWeights
): Promise<ScoredUnit[]> {
  const supabase = await createAdminClient()

  const [oddsResult, contextResult] = await Promise.all([
    supabase
      .from('draw_odds')
      .select('unit_number, year, draw_odds_percent, avg_points_drawn, min_points_drawn, total_applicants, successful_draws')
      .eq('state', state)
      .eq('species', species)
      .eq('weapon_type', weaponType)
      .order('year', { ascending: true }),

    supabase
      .from('unit_context')
      .select('unit_number, trophy_quality, public_land_percent, access_type, terrain, notes')
      .eq('state', state)
      .eq('species', species),
  ])

  const allYearsData = oddsResult.data ?? []
  if (!allYearsData.length) return []

  const currentYearData = allYearsData.filter(r => r.year === year)
  if (!currentYearData.length) return []

  // Build context lookup map
  const contextMap = new Map<string, typeof contextResult.data extends (infer T)[] | null ? T : never>(
    (contextResult.data ?? []).map((c: any) => [c.unit_number, c])
  )

  const oddsValues = currentYearData.map(r => r.draw_odds_percent ?? 0)
  const minOdds = Math.min(...oddsValues)
  const maxOdds = Math.max(...oddsValues)

  const scored: ScoredUnit[] = currentYearData.map(row => {
    const ctx = contextMap.get(row.unit_number) as any ?? null

    const oddsScore = normalize(row.draw_odds_percent ?? 0, minOdds, maxOdds)

    const minPts = row.min_points_drawn ?? 0
    let reachabilityScore: number
    if (minPts <= points) reachabilityScore = 1
    else if (minPts <= points + 2) reachabilityScore = 0.5
    else reachabilityScore = 0

    // pointsBurnWillingness boosts hard units
    const burnAdjust = (weights.pointsBurnWillingness - 1) / 4
    const effectiveReachability = reachabilityScore + burnAdjust * (1 - reachabilityScore) * 0.5

    // Trophy quality: use real data if available, else proxy via draw odds
    const trophyScore = ctx?.trophy_quality != null
      ? (ctx.trophy_quality - 1) / 4  // normalize 1-5 → 0-1
      : oddsScore * 0.8               // fallback proxy

    // Public land access: use real data if available, else neutral
    const accessScore = ctx?.public_land_percent != null
      ? ctx.public_land_percent / 100
      : 0.5

    const wOdds   = weights.drawOdds / 5
    const wTrophy = weights.trophyQuality / 5
    const wAccess = weights.publicLandAccess / 5
    const total   = wOdds + wTrophy + wAccess || 1

    const composite = (
      wOdds   * oddsScore * effectiveReachability +
      wTrophy * trophyScore +
      wAccess * accessScore
    ) / total

    // Trend + projections
    const unitHistory = allYearsData
      .filter(r => r.unit_number === row.unit_number)
      .sort((a, b) => a.year - b.year)

    let trend: ScoredUnit['trend'] = 'unknown'
    let plus1yr: number | null = null
    let plus2yr: number | null = null
    let plus3yr: number | null = null

    if (unitHistory.length >= 2) {
      const recentOdds = unitHistory.slice(-3).map(r => r.draw_odds_percent ?? 0)
      const avgChange = recentOdds.length > 1
        ? (recentOdds[recentOdds.length - 1] - recentOdds[0]) / (recentOdds.length - 1)
        : 0

      if (avgChange > 0.5) trend = 'loosening'
      else if (avgChange < -0.5) trend = 'tightening'
      else trend = 'stable'

      const base = row.draw_odds_percent ?? 0
      plus1yr = Math.max(0, Math.min(100, base + avgChange))
      plus2yr = Math.max(0, Math.min(100, base + avgChange * 2))
      plus3yr = Math.max(0, Math.min(100, base + avgChange * 3))
    }

    return {
      unit_number:         row.unit_number,
      draw_odds_percent:   row.draw_odds_percent,
      avg_points_drawn:    row.avg_points_drawn,
      min_points_drawn:    row.min_points_drawn,
      total_applicants:    row.total_applicants,
      successful_draws:    row.successful_draws,
      composite_score:     composite,
      reachable_this_year: minPts <= points,
      trophy_quality:      ctx?.trophy_quality ?? null,
      public_land_percent: ctx?.public_land_percent ?? null,
      access_type:         ctx?.access_type ?? null,
      terrain:             ctx?.terrain ?? null,
      notes:               ctx?.notes ?? null,
      projection:          { plus1yr, plus2yr, plus3yr },
      trend,
    }
  })

  return scored.sort((a, b) => b.composite_score - a.composite_score).slice(0, 10)
}
