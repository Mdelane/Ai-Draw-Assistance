import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const state = searchParams.get('state')
  const species = searchParams.get('species')

  const supabase = await createAdminClient()
  let query = supabase
    .from('listings')
    .select('id, title, base_price, species, states, photos, listing_type')
    .eq('is_active', true)
    .limit(3)

  if (state) query = query.overlaps('states', [state])
  if (species) query = query.overlaps('species', [species.toLowerCase()])

  const { data } = await query
  return NextResponse.json({ listings: data ?? [] })
}
