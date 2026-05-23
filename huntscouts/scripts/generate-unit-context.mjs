/**
 * generate-unit-context.mjs
 *
 * Reads every distinct (state, species, unit_number) from draw_odds,
 * calls Claude Haiku once per unit to get structured context, and
 * upserts results into the unit_context table.
 *
 * Usage:
 *   node scripts/generate-unit-context.mjs
 *
 * Options:
 *   --state CO         only process one state
 *   --species elk      only process one species
 *   --force            re-generate even if unit_context row already exists
 *   --dry-run          print what would be generated without writing to DB
 *
 * Throttled to 5 requests/second to avoid Anthropic rate limits.
 * Safe to re-run — skips units that already have context unless --force.
 */

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

config({ path: '.env.local' })

const args = Object.fromEntries(
  process.argv.slice(2)
    .filter(a => a.startsWith('--'))
    .map(a => {
      const [key, val] = a.slice(2).split('=')
      return [key, val ?? true]
    })
)

const stateFilter  = process.argv.find((a, i) => process.argv[i - 1] === '--state')
const speciesFilter = process.argv.find((a, i) => process.argv[i - 1] === '--species')
const force   = process.argv.includes('--force')
const dryRun  = process.argv.includes('--dry-run')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const BATCH_SIZE = 5
const DELAY_MS   = 200 // 5 req/sec

const sleep = ms => new Promise(r => setTimeout(r, ms))

async function getUnitContext(state, species, unitNumber, history) {
  const historyText = history
    .map(r => `  ${r.year}: ${r.draw_odds_percent ?? '?'}% odds, avg ${r.avg_points_drawn ?? '?'} pts, ${r.total_applicants ?? '?'} applicants`)
    .join('\n')

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: `You are a western big game hunting expert with deep knowledge of unit-level conditions across CO, WY, MT, UT, ID, AZ, and NV. Given a unit's draw history, estimate its characteristics. Respond ONLY with valid JSON matching the exact schema provided. No prose, no markdown.`,
    messages: [
      {
        role: 'user',
        content: `State: ${state}
Species: ${species}
Unit: ${unitNumber}
Draw history (most recent first):
${historyText}

Respond with this exact JSON schema:
{
  "trophy_quality": <integer 1-5, where 5 = top trophy destination>,
  "public_land_percent": <integer 0-100, estimated % of unit that is public land>,
  "access_type": <"drive-in" | "pack-in" | "fly-in" | "mixed">,
  "terrain": <"flat" | "rolling" | "mountainous" | "alpine" | "desert" | "mixed">,
  "notes": <1-2 sentence summary a hunter would find useful>
}`,
      },
    ],
  })

  const text = message.content[0]?.text?.trim()
  const parsed = JSON.parse(text)

  // Validate required fields
  if (
    typeof parsed.trophy_quality !== 'number' ||
    typeof parsed.public_land_percent !== 'number' ||
    !['drive-in', 'pack-in', 'fly-in', 'mixed'].includes(parsed.access_type) ||
    !['flat', 'rolling', 'mountainous', 'alpine', 'desert', 'mixed'].includes(parsed.terrain)
  ) {
    throw new Error(`Invalid response schema: ${text}`)
  }

  return parsed
}

async function main() {
  console.log('Fetching distinct units from draw_odds...')

  // Get all draw_odds data grouped by unit
  let oddsQuery = supabase
    .from('draw_odds')
    .select('state, species, unit_number, year, draw_odds_percent, avg_points_drawn, total_applicants')
    .order('year', { ascending: false })

  if (stateFilter)   oddsQuery = oddsQuery.eq('state', stateFilter)
  if (speciesFilter) oddsQuery = oddsQuery.eq('species', speciesFilter)

  const { data: allOdds, error } = await oddsQuery
  if (error) { console.error('Supabase error:', error); process.exit(1) }
  if (!allOdds?.length) { console.log('No draw_odds data found — run import-draw-odds.mjs first.'); process.exit(0) }

  // Group by unit
  const unitMap = new Map()
  for (const row of allOdds) {
    const key = `${row.state}|${row.species}|${row.unit_number}`
    if (!unitMap.has(key)) unitMap.set(key, { state: row.state, species: row.species, unit_number: row.unit_number, history: [] })
    unitMap.get(key).history.push(row)
  }

  const units = [...unitMap.values()]
  console.log(`Found ${units.length} distinct units.`)

  // Check which already have context
  let toProcess = units
  if (!force) {
    const { data: existing } = await supabase
      .from('unit_context')
      .select('state, species, unit_number')

    const existingSet = new Set((existing ?? []).map(r => `${r.state}|${r.species}|${r.unit_number}`))
    toProcess = units.filter(u => !existingSet.has(`${u.state}|${u.species}|${u.unit_number}`))
    console.log(`Skipping ${units.length - toProcess.length} already-generated units. Processing ${toProcess.length}.`)
  }

  if (dryRun) {
    console.log('--dry-run: would process:', toProcess.map(u => `${u.state} ${u.species} ${u.unit_number}`).join(', '))
    return
  }

  let success = 0, failed = 0

  for (let i = 0; i < toProcess.length; i += BATCH_SIZE) {
    const batch = toProcess.slice(i, i + BATCH_SIZE)

    await Promise.all(batch.map(async unit => {
      try {
        const ctx = await getUnitContext(unit.state, unit.species, unit.unit_number, unit.history)

        const { error: upsertErr } = await supabase
          .from('unit_context')
          .upsert({
            state:               unit.state,
            species:             unit.species,
            unit_number:         unit.unit_number,
            trophy_quality:      Math.min(5, Math.max(1, Math.round(ctx.trophy_quality))),
            public_land_percent: Math.min(100, Math.max(0, Math.round(ctx.public_land_percent))),
            access_type:         ctx.access_type,
            terrain:             ctx.terrain,
            notes:               ctx.notes ?? null,
            generated_at:        new Date().toISOString(),
          }, { onConflict: 'state,species,unit_number' })

        if (upsertErr) throw upsertErr

        console.log(`✓ ${unit.state} ${unit.species} unit ${unit.unit_number} — trophy:${ctx.trophy_quality} land:${ctx.public_land_percent}% ${ctx.access_type}`)
        success++
      } catch (err) {
        console.error(`✗ ${unit.state} ${unit.species} unit ${unit.unit_number}: ${err.message}`)
        failed++
      }
    }))

    const remaining = toProcess.length - i - BATCH_SIZE
    if (remaining > 0) {
      process.stdout.write(`  [${i + BATCH_SIZE}/${toProcess.length}] waiting...\r`)
      await sleep(DELAY_MS)
    }
  }

  console.log(`\nDone. ${success} succeeded, ${failed} failed.`)
  if (failed > 0) console.log('Re-run to retry failures (already-generated units are skipped automatically).')
}

main().catch(err => { console.error(err); process.exit(1) })
