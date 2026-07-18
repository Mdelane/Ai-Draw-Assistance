# HuntScouts — Feature & Marketing Roadmap
> Sourced from `marketing condensed.docx`. Check items off as they're completed.

---

## PHASE 1 — DB & Legal Foundation
*Must ship before any new features go live.*

### Database Migrations
- [x] `hunters_master` table — maps to existing `users` + `scout_profiles` (extended in place)
- [x] `hunter_points_inventory` table — maps to existing `scout_points` table
- [x] `hunter_ballistics_spec` table — added as columns on `scout_profiles` (caliber, max_effective_range_yards, preferred_shot_distance)
- [x] `hunter_medical_environmental` table — added as columns on `scout_profiles` (altitude_tolerance; fitness_level + physical_limitations already existed)
- [x] `hunter_commercial_intent` table — columns already existed on `scout_profiles` (guide_preference, budget_range, first_time_species, ever_guided)
- [x] `unit_recommendation_allocations` table — log of AI recommendations per user per query
- [x] `party_hunt_rooms` table — room_id, owner_user_id, state, species, weapon_type, invites[], status
- [x] `state_regulatory_overrides` table — seeded with 14 rows for 7 launch states
- [x] `marketplace_listings` — added `listing_type`, `landowner_verified`, `acreage`, `geo_fuzzing_enabled`, `priority_access`
- [x] `escrow_ledger` table — double-entry: booking_id, debit_account, credit_account, amount, event_type

### Legal & Compliance Pages
- [x] Add FTC disclaimer to Scout AI output ("Draw odds are historical data, not a guarantee")
- [x] Add Section 230 shield language to Terms of Service
- [x] Build trespass liability gate — clickwrap modal on trespass fee listing checkout
- [x] Add "Point Guard" retention warning on account deletion flow ("You have X points tracked — are you sure?")
- [x] Add data provenance disclosure (where FOIA data comes from) to Scout page footer
- [x] Wire legal clickwrap acceptance timestamp to `users` table (`tos_accepted_at`)

---

## PHASE 2 — Scout AI Enhancement

### Point Valuation Engine
- [x] `PointValuationService` — `lib/scout/pointValuation.ts` with valuatePoints() + valuatePortfolio()
- [x] `STATE_POINT_COST_MATRIX` — annual application fees for CO, WY, MT, UT, ID, AZ, NV (WY per-species)
- [x] "Your points are worth ~$X" display on Scout page — Points Portfolio widget (server-side, below ScoutChat)
- [x] Portfolio summary widget — total invested across all combos shown in widget

### Draw Probability Simulator
- [x] `DrawSimulationEngine` — `/api/scout/simulate` POST route wraps `scoreUnits()`, free users see top 3
- [x] "What if I wait 1/2/3 years" projection UI — `DrawSimulator.tsx` client component on Scout page
- [x] "Point creep dead zone" detector — red badge on units where avg_points_drawn > hunter_pts+3 and tightening/stable
- [ ] Export draw strategy report as PDF (or shareable link)

### Regulatory Middleware
- [x] `state_regulatory_overrides` middleware in chat route — fetched per-state and injected into system prompt
- [x] Seed overrides: CO preference, WY bonus, AZ weighted, MT/UT/ID/NV — all 14 rows seeded in Phase 1 migration
- [x] Display regulatory notes on Scout output — AI instructed to surface notes when relevant

### Point Guard Engine (Retention)
- [x] Deadline reminder system — `lib/cron/point-guard.ts` — queries deadlines + users with alert_deadline=true, stubs email send
- [x] "Application window open" banner on Scout page — amber banner filtered to user's states, red pill when ≤14 days
- [x] Opt-in preference: `alert_deadline` field already exists on `scout_profiles` — cron reads it

---

## PHASE 3 — Marketplace Expansion

### Landowner / Trespass Fee Listings
- [x] DB: `listing_type`, `acreage`, `geo_fuzzing_enabled`, `landowner_verified`, `priority_access` columns added (Phase 1)
- [x] Listing create/edit form — 3-button type toggle; trespass shows acreage + geo_fuzzing, hides guide fields
- [x] Listing detail page — trespass variant: no guide ratio/success rate/lodging, shows acreage + GPS fuzzing note
- [x] Geo-fuzzing modifier — "Approx. location shown — exact coordinates provided after booking confirmed"
- [x] Trespass liability clickwrap — TrespassLiabilityGate.tsx wired to booking flow (Phase 1)
- [x] Landowner verification badge — green "✓ Verified Landowner" pill on listing hero

### Stripe Connect — Marketplace Split
- [ ] Set up Stripe Connect platform account *(needs credentials)*
- [ ] Outfitter/landowner onboarding flow — Connect OAuth or restricted key per account
- [ ] 90/10 split: 90% to outfitter, 10% platform fee (7% for founding outfitters = 93/7)
- [ ] Payout scheduling — release after hunt completion + 48h dispute window
- [ ] Update `escrow_ledger` to reflect Connect payouts
- [ ] Stripe Connect dashboard link in outfitter dashboard ("View your payouts")

### 48-Hour Priority Lock
- [x] `priority_access` column on listings — outfitter sets it in create/edit form
- [x] Priority Listing badge on listing detail hero (dark green pill)
- [ ] "Only X dates left" urgency badge — needs available_dates tracking (deferred)
- [ ] Push notification / email when a priority listing goes live *(needs Resend)*

### Zero-Commission Pilot (First 3 Bookings)
- [x] `pilot_bookings_remaining` + `bookings_completed_count` on `outfitter_profiles` (Phase 1)
- [x] Auto-decrement on booking completion — `/api/bookings/[id]/complete` increments count + decrements pilot
- [x] Outfitter listings page banner — "X bookings remaining at 0%" / "Pilot complete — locked at 7%"
- [ ] Admin toggle to grant/revoke zero-commission pilot status *(low priority)*

---

## PHASE 4 — Viral Growth Features

### Party Draw Engine
- [x] `party_hunt_rooms` + `party_hunt_members` DB tables (Phase 1)
- [x] "Hunt with a group" button on Scout page → `/party/new` form
- [x] Room view `/party/[id]` — member list with points, group strategy, reachable units table
- [x] `calculatePartyStrategy()` in `lib/scout/partyStrategy.ts` — finds units all members can draw
- [x] Party invite landing `/invite/party/[code]` — join button for logged-in users, signup CTA for non-users
- [x] Lock Room button (owner-only) — `/api/party/[id]/lock`
- [ ] Notification to room owner when all members have joined *(needs Resend)*

### Referral Layer
- [x] `ref_code` auto-generated on users table (Phase 1)
- [x] `referred_by` captured at signup — reads `?ref=CODE` param, writes referrer ID
- [x] Referral link displayed in account page with one-click copy
- [x] `/invite/[code]` landing page — personalized dark green hero + amber CTA
- [ ] Credit referrer 1 free query on referred paid signup *(needs Stripe webhook hook)*

### Anti-Leakage Messaging Controller
- [ ] *(Deferred — no messaging system built yet)*

### Competitive Attack System — Draw Failure Loop
- [x] DrawSimulator cross-sell: all units < 5% odds → "High point-creep risk detected" + matched listings
- [x] `/api/listings/cross-sell` route — filters by state + species, returns 3 listings
- [ ] Draw failure email trigger *(needs Resend)*

---

## PHASE 5 — Email & SMS Infrastructure

### 3-Part Automated Nurture Sequence (Resend)
- [x] **Email 1 (post-signup):** `sendWelcomeEmail` — "Your AI Draw Strategy (And a warning about your points)" — fired from signup page
- [x] **Email 2 (Day 3):** `sendNurtureDay3` — "The Unsuccessful backup plan" — marketplace angle
- [x] **Email 3 (Day 7):** `sendNurtureDay7` — "Vetted ranches are booking up" — urgency + listings
- [x] Sends from `scout@huntscouts.com` via Resend (guards against missing API key)
- [x] Unsubscribe link in all emails → `/api/email/unsubscribe?uid=[id]` sets `email_unsubscribed = true`
- [x] `nurture_stage` column tracks progress (0→1→2→3); prevents duplicate sends
- [x] Cron: `/api/cron/nurture` daily at 10am — finds Day 3 + Day 7 users and sends
- [x] DB migration: `supabase/add-phase5-email.sql` *(run this in Supabase SQL editor)*

### Twilio SMS Pipeline
- [x] `lib/sms/send.ts` — native fetch Twilio wrapper, no-op when env vars missing
- [x] SMS opt-in — phone number + checkbox on account page
- [x] Point Guard cron wired to SMS — sends deadline alerts to opted-in hunters
- [x] `/api/cron/point-guard` — daily at 9am, protected by `CRON_SECRET`
- [x] DB migration: `supabase/add-phase5-sms.sql` *(run this in Supabase SQL editor)*
- [ ] SMS trigger: party room invite accepted *(deferred)*
- [ ] SMS trigger: priority listing goes live *(deferred)*
- **Env vars needed:** `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `CRON_SECRET`

### Cold Outreach Templates (Manual — founder executes)
- [x] **Outfitter Email 1:** `emails/outfitter-outreach-1.md` — free listing + 0% commission pitch
- [x] **Outfitter Email 2:** `emails/outfitter-outreach-2.md` — 5-day follow-up, anti-broker angle
- [ ] Scrape 50 target outfitters in CO/WY/MT/UT and send first batch of 25

---

## PHASE 6 — SEO & Content (30-Day Roadmap)

### Week 1 — Colorado Elk Draw Odds
- [ ] Blog post: *"The Hard Truth About Colorado Elk Preference Points in 2026"*
  - Cover: point creep data, dead zones by unit, what your points are actually worth
  - CTA: Free point audit via Scout AI
- [ ] Short-form video: Script #1 "Point Creep Death Report" (green screen, state draw PDF)
- [ ] Forum data drop on Rokslide/HuntTalk: "We analyzed 15 years of CO elk draw data — here's when your points become mathematically useless"

### Week 2 — Trespass Fee Hunts
- [ ] Blog post: *"What is a Hunting Trespass Fee (And How to Find One Without a Broker)"*
  - Cover: what trespass fees are, typical prices by species, how to vet a landowner
  - CTA: Browse trespass listings on HuntScouts
- [ ] Short-form video: Script #3 "Anti-Broker Callout" (sporting goods store, honest camera)
- [ ] Post in Facebook hunting groups: landowner angle ("I listed my property trespass tags on a marketplace — here's what happened")

### Week 3 — Wyoming General Tag
- [ ] Blog post: *"How Many Points for a Wyoming General Elk Tag This Year?"*
  - Cover: year-by-year trend, min/avg points drawn, units still accessible with 0–3 pts
  - CTA: Plug your points into Scout AI
- [ ] Short-form video: Script #2 "Over-The-Counter Scramble" (desk, hands on face)
- [ ] Forum thread on WY-specific board with data analysis, offer point audits in comments

### Week 4 — Private Land / Landowner
- [ ] Blog post: *"How Landowners Can Safely Monetize Hunting Rights Without Long-Term Leases"*
  - Cover: trespass fee vs. lease comparison, liability basics, how to price tags
  - CTA: List your property on HuntScouts
- [ ] Short-form video: Script #5 (landowner angle — "I made $X from my elk tags last fall")
- [ ] Target: cattlemen's association Facebook groups, ag co-op noticeboards

### Ongoing Content
- [ ] Scripts #4, #6, #7, #8, #9, #10 — film and post on 2-week cadence
- [ ] 5 zero-dollar distribution playbooks — execute one per week (Reddit, Facebook groups, YouTube, email list swap, podcast guesting)
- [ ] "Failed draw retargeting" paid social ads — run the week draw results drop in CO and WY (May/June)
- [ ] Micro-influencer outreach — 10 hunting accounts under 50K followers, offer early Scout Pro access for content

---

## PHASE 7 — Advanced Technical (Post-Launch)

### Stripe Identity KYC
- [ ] Stripe Identity integration for outfitter/landowner verification
- [ ] ID verification gate before first payout (replaces manual license check)
- [ ] `identity_verified_at` timestamp on outfitter_profiles
- [ ] Admin review queue for flagged verifications

### B2B Telemetry & Data Pipeline
- [ ] Anonymized draw data export (aggregate, no PII) — format for potential B2B licensing to ammo/gear brands
- [ ] `analytics_export` table — pre-aggregated by state/species/weapon/unit
- [ ] API endpoint (internal) for generating monthly data reports

### IoT Trail Camera Webhook Gateway
- [ ] Webhook receiver: `POST /api/webhooks/trail-camera`
- [ ] Support: Reconyx HyperFire, Spypoint, Stealth Cam (common formats)
- [ ] Store: image URL, location (fuzzy), timestamp, associated listing_id
- [ ] Display on listing detail page — "Live from camp" photo feed

### Offline Sync Controller
- [ ] Service worker for Scout page — cache last draw odds query result
- [ ] GZIP sync on reconnect — push any offline scout queries to server
- [ ] "Offline mode" indicator in Scout UI

### Anti-Scraping Wall
- [ ] Rate limiting on `/api/scout/*` — 60 req/hour per IP for unauthenticated
- [ ] Honeypot fields on listing create form to detect bots
- [ ] Block headless browser signatures on draw odds endpoints

---

## PHASE 8 — Launch Week Playbook (48-Hour Sprint)

### 3 Weeks Pre-Launch
- [ ] Manually onboard 30–50 outfitters (use zero-commission pitch)
- [ ] Build waitlist landing page at `/early-access` — capture email + state + species
- [ ] Seed micro-influencer affiliates with early Scout Pro access (no payment, just access)
- [ ] Have all 10 video scripts filmed and scheduled, not yet posted

### 7 Days Out
- [ ] All influencer videos scheduled for launch day
- [ ] Email blast to waitlist: "HuntScouts launches in 7 days — your Scout Pro trial starts day 1"
- [ ] Forum teaser posts with draw data snippet (don't link yet — build curiosity)

### Launch Day 00:00
- [ ] All 10 influencer videos go live simultaneously
- [ ] Forum data drops live on Rokslide + HuntTalk + Archery Talk
- [ ] Product Hunt launch post
- [ ] LinkedIn post (founder angle — "Built this for hunters, not VCs")

### Launch Day 12:00
- [ ] Paywall trigger copy live on Scout (Email 1 goes out to everyone who signed up before noon)
- [ ] Marketplace cross-sell banners live
- [ ] Monitor Stripe for first real booking

### Launch Week (Days 2–7)
- [ ] Reply personally to every forum comment + DM
- [ ] "Failed draw retargeting" ads live on Meta (target: CO/WY draw results audience)
- [ ] Email 2 sends on Day 3
- [ ] Email 3 sends on Day 7
- [ ] Count: target 50 registered hunters, 10 live listings, 1 completed booking by end of week

---

## QUICK WINS (Can do anytime, low effort)

- [ ] Add UVP #1–5 copy to homepage hero A/B test variants
- [ ] Add "Point Creep Risk" label to Scout units where avg_points_drawn is rising YoY
- [ ] Add "Backup plan" CTA to Scout results page when all top units show < 10% odds
- [ ] Wire `RESEND_API_KEY` and send first transactional email (booking confirmation)
- [ ] Add `NEXT_PUBLIC_GA_MEASUREMENT_ID` to `.env.local` and Vercel
- [ ] Replace Tally form placeholder in `app/outfitters/apply/page.tsx`
- [ ] Verify Cal.com link `https://cal.com/huntscouts/outfitter-onboarding` is live
- [ ] Deploy to Vercel — add all env vars, connect domain `huntscouts.com`

---

---

## PHASE 9 — Unit Intelligence & Trip Planning

> Goal: every unit page becomes the single best resource on the internet for hunting that unit. More useful than any forum post, guidebook, or outfitter brochure.

---

### 9A — Database Schema

- [ ] `unit_weather` table — unit_id, month (1–12), avg_high_f, avg_low_f, avg_precipitation_in, avg_snowfall_in, data_source
- [ ] `unit_access_profile` table — unit_id, utv_accessible, horse_accessible, backpack_in_required, truck_camping, mountain_bike, ebike_accessible, min_elevation_ft, max_elevation_ft, terrain_difficulty (1–5 scale), road_condition_notes, pack_out_required
- [ ] `unit_water_sources` table — id, unit_id, name, type (stream/spring/lake/reservoir/stock_tank), lat_approx, lng_approx, seasonal (bool), peak_months int[], treatment_required (bool), notes
- [ ] `unit_ranger_stations` table — id, state, unit_id (nullable — one station may serve multiple units), name, agency (USFS/BLM/State/County), address, phone, website, hours_notes, is_kill_validation_station (bool), validation_method (online/in-person/phone/any)
- [ ] `unit_regulations` table — id, state, species, year, unit_id (nullable), kill_reporting_required (bool), kill_reporting_methods text[], kill_reporting_deadline_hours int, document_url, key_notes text
- [ ] `unit_documents` table — id, state, species, year, unit_id (nullable), document_type (regulations/map/access), title, file_url, source_agency, last_verified_at
- [ ] Extend `unit_context` — add gear_recommendation text, access_summary text, unit_centroid_lat, unit_centroid_lng

---

### 9B — Weather Integration

- [ ] NOAA Climate Data Online API — fetch 30-year monthly normals by lat/lng (free, no key required for normals endpoint)
- [ ] Unit centroid coordinates — compile lat/lng center for each unit (manual or from state GIS shapefiles)
- [ ] `scripts/generate-unit-weather.mjs` — iterates units, hits NOAA API, populates `unit_weather` table
- [ ] "Hunt window" detector — auto-highlight the 2–3 months relevant to each species/season type (e.g. Sept–Nov for elk)
- [ ] Weather display component on unit detail — monthly stat cards for hunt window: high/low temp, precip, snowfall
- [ ] Snowfall warning flag — if avg snowfall > 6" in hunt month, show "❄ Early snow possible — check road conditions before departure"
- [ ] Forecast integration (optional) — if hunt date is within 10 days, pull live 10-day forecast from NWS API

---

### 9C — Terrain & Access Profile

- [ ] Expand access type to structured boolean fields per unit (see schema above)
- [ ] Elevation data — pull min/max elevation per unit from USGS 3DEP or NED elevation dataset
- [ ] Terrain difficulty rating (1=flat/road-accessible, 5=technical pack-in, cliff/talus only)
- [ ] Access profile UI chips on unit detail — icon row: 🚗 Truck Camping · 🐴 Horse · 🏕 Backpack · 🛻 UTV · 🚵 Mountain Bike
- [ ] "Pack in only" warning badge — prominent red banner if backpack_in_required = true
- [ ] "What to drive" section — explicit plain-English recommendation based on access profile
- [ ] Seasonal road closure notes — many forest roads close Nov 1 or after first snow; capture per unit

---

### 9D — Water Sources

- [ ] USGS National Hydrography Dataset (NHD) download — free shapefile download per state at nhd.usgs.gov
- [ ] `scripts/import-nhd-water-sources.mjs` — process NHD GIS shapefiles, clip to unit boundaries, import named water features into `unit_water_sources`
- [ ] Manual review pass — flag stock tanks, springs (often unnamed in NHD), remove irrelevant features
- [ ] Water source display on unit detail — list with type icon, seasonal availability, and treatment warning
- [ ] Giardia/treatment notice — "Always treat or filter backcountry water. Giardia is present in most western drainages."
- [ ] Late-season dryness flag — if unit is high desert (UT/AZ/NV/NM) and hunt month is Aug–Sept, flag "Many water sources dry by late summer — cache water or confirm sources before entry"

---

### 9E — Ranger Stations & Kill Validation

- [ ] Research kill reporting requirements per state × species (7 states × ~5 species = ~35 combinations)
  - [ ] Colorado — CPW online reporting via MyColoradoHunt (most species within 48 hrs)
  - [ ] Wyoming — online or phone for most; in-person check station for some regions
  - [ ] Montana — harvest report card system; some species require check station or phone report
  - [ ] Utah — online reporting via WILD app within 48 hrs for most big game
  - [ ] Idaho — iHunt app or phone within 5 days for most species
  - [ ] Arizona — AZGFD online or phone within 48 hrs; some species in-person
  - [ ] Nevada — online reporting within 3 days; some check stations during peak seasons
- [ ] Compile ranger station directory — USFS + BLM district offices serving each unit (address, phone, hours, GPS)
  - [ ] Colorado units
  - [ ] Wyoming units
  - [ ] Montana units
  - [ ] Utah units
  - [ ] Idaho units
  - [ ] Arizona units
  - [ ] Nevada units
- [ ] Kill validation card on unit detail — prominent callout: method, deadline, link/phone number
- [ ] `/states/[state]/regulations` page — flat reference page with kill reporting matrix by species
- [ ] Ranger station cards on unit detail — name, agency badge, address, phone, map link, "Kill validation here" badge if applicable

---

### 9F — Regulations Documents

- [ ] Download current-year regulation PDFs for each state × species (update each spring when states publish)
  - [ ] Colorado — cpw.state.co.us
  - [ ] Wyoming — wgfd.wyo.gov
  - [ ] Montana — fwp.mt.gov
  - [ ] Utah — wildlife.utah.gov
  - [ ] Idaho — idfg.idaho.gov
  - [ ] Arizona — azgfd.com
  - [ ] Nevada — ndow.org
- [ ] Upload PDFs to Supabase Storage or Vercel Blob; store URLs in `unit_documents` table
- [ ] Key regulations extractor — Claude prompt to parse each PDF and extract: season dates, bag limit, legal weapons, special unit restrictions, application deadlines
- [ ] Store extracted key regs as structured JSON in `unit_regulations.key_notes`
- [ ] Display on unit detail — "Key Regs" card with extracted bullet points + "View full regulations PDF →" link
- [ ] Annual update reminder — cron job that flags `unit_documents` records where `last_verified_at < current_year` each January

---

### 9G — AI Gear Recommendation

- [ ] Gear recommendation prompt — Claude generates gear list from: terrain_difficulty, access_type, species, elevation, hunt_month, group_size
- [ ] Gear categories: Transport method · Shelter · Water treatment · Navigation · Communication · First aid · Packing out
- [ ] "What you'll need to get there" section — lead with transport recommendation (truck, horse trailer, UTV, backpack)
- [ ] Store generated recommendation in `unit_context.gear_recommendation` (regenerate if access profile changes)
- [ ] Gear checklist display — expandable sections per category, printable
- [ ] Weight estimate flag — if terrain_difficulty >= 4, show estimated pack weight range for a multi-day hunt

---

### 9H — Hunt Prep Trip Card

- [ ] Dynamic trip card generator — user selects unit + species + dates + group size → generates shareable trip summary
- [ ] Trip card contents: unit info, access route, gear recommendation, water sources, ranger station, kill reporting method, emergency contacts, weather forecast
- [ ] Printable / PDF export
- [ ] Shareable link — `/trip/[token]` with pre-filled trip card (no login required to view)
- [ ] Emergency contact slot — user enters satellite communicator number (Garmin inReach, SPOT) + party contact
- [ ] "Leave No Trace" reminder section — unit-specific (more critical in high-pressure units)

---

## DEFERRED (Needs resources/credentials)

| Item | Blocker |
|------|---------|
| Unit context generation (AI descriptions per unit) | ~$5 Anthropic API credits → run `node scripts/generate-unit-context.mjs` |
| Stripe payments live | Fill in `STRIPE_SECRET_KEY` + 3 other Stripe env vars |
| Transactional emails | Fill in `RESEND_API_KEY` |
| SMS alerts | Twilio account + phone number |
| Stripe Connect payouts | Stripe Connect platform setup |
| KYC verification | Stripe Identity product enabled |
| Domain live | DNS pointed to Vercel |
