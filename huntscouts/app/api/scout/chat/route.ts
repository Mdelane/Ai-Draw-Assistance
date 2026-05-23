import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { requireUser, isScoutPro } from '@/lib/auth/requireUser'
import { scoreUnits } from '@/lib/scout/score'
import { createAdminClient } from '@/lib/supabase/server'
import { checkScoutRateLimit } from '@/lib/scout/checkRateLimit'

const DEFAULT_WEIGHTS = {
  drawOdds: 3,
  trophyQuality: 3,
  publicLandAccess: 3,
  pointsBurnWillingness: 3,
}

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  let userCtx: Awaited<ReturnType<typeof requireUser>>
  try {
    userCtx = await requireUser()
  } catch (res) {
    return res as NextResponse
  }

  if (!userCtx.user.email_confirmed_at) {
    return NextResponse.json(
      { error: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email before using Scout AI.' },
      { status: 403 }
    )
  }

  const profile = userCtx.profile as any
  const paid = isScoutPro(profile)

  const supabase = await createAdminClient()

  // Check free query status for non-subscribers
  if (!paid) {
    const { data: userRow } = await supabase
      .from('users')
      .select('scout_free_query_used')
      .eq('id', userCtx.user.id)
      .single()

    if (userRow?.scout_free_query_used) {
      return NextResponse.json({ error: 'Scout Pro subscription required' }, { status: 402 })
    }
  }

  if ((profile.scout_queries_this_month ?? 0) >= 999 && profile.account_flagged) {
    return NextResponse.json(
      { error: 'RATE_LIMITED', message: 'Scout AI is unavailable on this account.' },
      { status: 429 }
    )
  }

  if (paid) {
    const rateLimit = await checkScoutRateLimit(userCtx.user.id, paid)

    await supabase.from('abuse_signals').insert({
      event_type: 'scout_query',
      user_id: userCtx.user.id,
      meta: { allowed: rateLimit.allowed, remaining: rateLimit.remaining },
    })

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: 'RATE_LIMITED',
          message: `You have reached your ${rateLimit.limit} Scout AI queries for this month. Resets ${rateLimit.resetDate}.`,
          upgradeUrl: '/scout/upgrade',
          remaining: 0,
          resetDate: rateLimit.resetDate,
        },
        { status: 429 }
      )
    }

    if (profile.scout_status === 'trial' && rateLimit.remaining === 0) {
      return NextResponse.json({ type: 'TRIAL_LIMIT_REACHED' }, { status: 402 })
    }
  }

  const { state, species, weaponType, points, year, messages, isFreeQuery } = await req.json()

  const scoredUnits = await scoreUnits(state, species, weaponType, points, year, DEFAULT_WEIGHTS)

  const { data: regulatoryOverrides } = await supabase
    .from('state_regulatory_overrides')
    .select('rule_type, rule_value, display_note, species, weapon_type')
    .eq('state', state)
    .or(`species.is.null,species.eq.${species}`)

  const regulatoryNotesBlock =
    regulatoryOverrides && regulatoryOverrides.length > 0
      ? `STATE REGULATORY NOTES FOR ${state.toUpperCase()}:\n${regulatoryOverrides
          .map((r: any) => `- ${r.display_note ?? r.rule_value}`)
          .join('\n')}`
      : ''

  // Free queries only see the top unit so the full list stays behind the paywall
  const unitsForPrompt = !paid && isFreeQuery ? scoredUnits.slice(0, 1) : scoredUnits

  await supabase.from('scout_queries').insert({
    user_id: userCtx.user.id,
    state, species, points, weapon_type: weaponType,
    priority_weights: DEFAULT_WEIGHTS,
  })

  // Mark free query used before streaming so a page refresh can't double-dip
  if (!paid && isFreeQuery) {
    await supabase.from('users').update({ scout_free_query_used: true }).eq('id', userCtx.user.id)
  }

  const freeQueryFooter = !paid && isFreeQuery
    ? `\n\nIMPORTANT: Give the hunter a complete, helpful answer for their top unit only. End your response with this exact sentence on its own line: "Subscribe to Scout Pro to see all your unit options, full draw strategy, and multi-year projections."`
    : ''

  const hasUnitContext = unitsForPrompt.some((u: any) => u.trophy_quality != null)

  const systemPrompt = `You are a western big game draw strategy expert for HuntScouts.

The hunter has ${points} preference points for ${species} in ${state} with a ${weaponType} tag for the ${year} season.

Here are their top scored units based on draw odds, trophy quality, and public land access:

${JSON.stringify(unitsForPrompt, null, 2)}

${hasUnitContext ? `Unit context fields:
- trophy_quality: 1 (low) to 5 (top destination)
- public_land_percent: % of unit that is publicly accessible
- access_type: how hunters typically reach the unit
- terrain: general landscape type
- notes: key things a hunter should know about this unit` : ''}
${regulatoryNotesBlock ? `\n${regulatoryNotesBlock}\n` : ''}
Rules:
- Only reference unit numbers and statistics from the data above. Never invent unit numbers or odds.
- Give specific, actionable advice. Reference unit numbers directly.
- For multi-year strategy, use the projection data and trend fields.
- Explain tradeoffs clearly — odds vs trophy quality vs points burn vs access difficulty.
- If asked "what if I wait", calculate using the plus1yr/plus2yr/plus3yr projections.
- When unit notes are available, weave in the practical details hunters care about (access, terrain, what to expect).
- Keep responses concise and direct. Hunters want answers, not disclaimers.
- Always surface relevant regulatory notes when they apply to the user's question. E.g., if a user asks about points, mention whether the state uses preference vs bonus points.${freeQueryFooter}`

  const stream = await anthropic.messages.stream({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    system: systemPrompt,
    messages: messages.map((m: { role: string; content: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  })

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          controller.enqueue(new TextEncoder().encode(chunk.delta.text))
        }
      }
      controller.close()
    },
  })

  return new NextResponse(readable, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
