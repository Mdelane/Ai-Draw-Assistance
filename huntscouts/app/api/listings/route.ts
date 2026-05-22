import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const supabase = await createClient()

  let query = supabase
    .from('listings')
    .select('id, title, species, states, base_price, duration_days, terrain_difficulty, booking_type, success_rate_override, ada_accessible, points_required, outfitter_profiles(id, business_name, success_rate)')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const species = searchParams.getAll('species')
  const states = searchParams.getAll('state')
  const weapons = searchParams.getAll('weapon')
  const access = searchParams.getAll('access')
  const minPrice = searchParams.get('min_price')
  const maxPrice = searchParams.get('max_price')
  const duration = searchParams.get('duration')
  const ada = searchParams.get('ada')
  const otc = searchParams.get('otc')
  const outfitterId = searchParams.get('outfitter')
  const limit = parseInt(searchParams.get('limit') ?? '50')
  const offset = parseInt(searchParams.get('offset') ?? '0')

  if (species.length) query = query.overlaps('species', species)
  if (states.length) query = query.overlaps('states', states)
  if (weapons.length) query = query.overlaps('weapon_types', weapons)
  if (access.length) query = query.in('access_type', access)
  if (minPrice) query = query.gte('base_price', parseFloat(minPrice))
  if (maxPrice) query = query.lte('base_price', parseFloat(maxPrice))
  if (ada === '1') query = query.eq('ada_accessible', true)
  if (otc === '1') query = query.eq('points_required', false)
  if (outfitterId) query = query.eq('outfitter_id', outfitterId)

  if (duration === '1-3') query = query.lte('duration_days', 3)
  else if (duration === '4-6') query = query.gte('duration_days', 4).lte('duration_days', 6)
  else if (duration === '7+') query = query.gte('duration_days', 7)

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await (query as any)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ listings: data, total: count })
}
