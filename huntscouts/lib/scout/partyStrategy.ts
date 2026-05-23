import { createAdminClient } from '@/lib/supabase/server'

export type PartyStrategyResult = {
  bestUnit: string | null
  groupOdds: number | null
  reachableUnits: { unit_number: string; draw_odds_percent: number; min_points_drawn: number }[]
  memberCount: number
  minPointsInGroup: number
}

export async function calculatePartyStrategy(
  roomId: string,
  state: string,
  species: string,
  weaponType: string,
  year: number
): Promise<PartyStrategyResult> {
  const supabase = await createAdminClient()

  const { data: members } = await supabase
    .from('party_hunt_members')
    .select('points, user_id')
    .eq('room_id', roomId)

  if (!members?.length) return { bestUnit: null, groupOdds: null, reachableUnits: [], memberCount: 0, minPointsInGroup: 0 }

  const minPoints = Math.min(...members.map(m => m.points ?? 0))

  const { data: units } = await supabase
    .from('draw_odds')
    .select('unit_number, draw_odds_percent, min_points_drawn')
    .eq('state', state)
    .eq('species', species)
    .eq('weapon_type', weaponType)
    .eq('year', year)
    .lte('min_points_drawn', minPoints)
    .order('draw_odds_percent', { ascending: false })
    .limit(10)

  const reachableUnits = (units ?? []).map(u => ({
    unit_number: u.unit_number,
    draw_odds_percent: u.draw_odds_percent ?? 0,
    min_points_drawn: u.min_points_drawn ?? 0,
  }))

  const best = reachableUnits[0] ?? null

  return {
    bestUnit: best?.unit_number ?? null,
    groupOdds: best?.draw_odds_percent ?? null,
    reachableUnits,
    memberCount: members.length,
    minPointsInGroup: minPoints,
  }
}
