/**
 * FOIA Draw Odds Import Script
 *
 * Usage:
 *   node scripts/import-draw-odds.mjs \
 *     --file ./data/colorado-elk-2024.csv \
 *     --state CO \
 *     --species elk \
 *     --weapon rifle \
 *     --year 2024
 *
 * Column mapping is configured below — update to match your CSV headers.
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'
import { parseArgs } from 'util'

const { values: args } = parseArgs({
  options: {
    file: { type: 'string' },
    state: { type: 'string' },
    species: { type: 'string' },
    weapon: { type: 'string' },
    year: { type: 'string' },
  },
})

if (!args.file || !args.state || !args.species || !args.weapon || !args.year) {
  console.error('Usage: node import-draw-odds.mjs --file <path> --state <CO> --species <elk> --weapon <rifle> --year <2024>')
  process.exit(1)
}

// ============================================================
// COLUMN MAPPING — update these to match your CSV headers
// ============================================================
const COLUMN_MAP = {
  unit_number: 'Unit',              // column name in CSV → our field
  total_applicants: 'Total Apps',
  successful_draws: 'Drawn',
  draw_odds_percent: 'Odds %',
  avg_points_drawn: 'Avg Points',
  min_points_drawn: 'Min Points',
}

function cleanNumber(val) {
  if (val == null || val === '' || val === 'N/A' || val === '-') return null
  return parseFloat(String(val).replace(/,/g, ''))
}

function cleanString(val) {
  if (val == null || val === '') return null
  return String(val).trim()
}

const SPECIES_ALIASES = {
  'mule deer': 'mule deer', 'muley': 'mule deer', 'md': 'mule deer',
  'whitetail': 'whitetail', 'white-tailed deer': 'whitetail', 'wtd': 'whitetail',
  'elk': 'elk', 'rocky mountain elk': 'elk',
  'pronghorn': 'pronghorn', 'antelope': 'pronghorn',
  'bear': 'bear', 'black bear': 'bear',
  'bighorn sheep': 'bighorn sheep', 'bighorn': 'bighorn sheep',
  'mountain goat': 'mountain goat', 'goat': 'mountain goat',
}

async function main() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const rawCsv = readFileSync(args.file, 'utf8')
  const records = parse(rawCsv, { columns: true, skip_empty_lines: true, trim: true })

  const normalizedSpecies = SPECIES_ALIASES[args.species.toLowerCase()] ?? args.species.toLowerCase()
  const year = parseInt(args.year)

  let inserted = 0, updated = 0, skipped = 0

  for (const row of records) {
    const unitNumber = cleanString(row[COLUMN_MAP.unit_number])
    if (!unitNumber) { skipped++; continue }

    const record = {
      state: args.state.toUpperCase(),
      species: normalizedSpecies,
      unit_number: unitNumber,
      weapon_type: args.weapon.toLowerCase(),
      year,
      total_applicants: cleanNumber(row[COLUMN_MAP.total_applicants]),
      successful_draws: cleanNumber(row[COLUMN_MAP.successful_draws]),
      draw_odds_percent: cleanNumber(row[COLUMN_MAP.draw_odds_percent]),
      avg_points_drawn: cleanNumber(row[COLUMN_MAP.avg_points_drawn]),
      min_points_drawn: cleanNumber(row[COLUMN_MAP.min_points_drawn]),
    }

    const { error, data } = await supabase
      .from('draw_odds')
      .upsert(record, { onConflict: 'state,species,unit_number,weapon_type,year', ignoreDuplicates: false })
      .select('id')

    if (error) {
      console.error(`Row ${unitNumber}:`, error.message)
      skipped++
    } else {
      // Check if it was an insert or update based on whether record existed
      inserted++
    }
  }

  console.log(`\nDone: ${inserted} upserted, ${skipped} skipped`)
  console.log(`State: ${args.state} | Species: ${normalizedSpecies} | Weapon: ${args.weapon} | Year: ${year}`)
}

main().catch(console.error)
