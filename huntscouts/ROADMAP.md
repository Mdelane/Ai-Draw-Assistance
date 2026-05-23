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
