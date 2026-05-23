-- Phase 1 Foundation Migration
-- New tables + column additions for HuntScouts roadmap Phase 1
-- Run in Supabase SQL Editor (safe to re-run — all IF NOT EXISTS / DO $$ guards)

-- ================================================================
-- 1. Users: ToS acceptance tracking + referral
-- ================================================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS tos_accepted_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ref_code text UNIQUE DEFAULT substr(md5(gen_random_uuid()::text), 1, 8);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by uuid REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_queries_earned integer DEFAULT 0;

-- ================================================================
-- 2. Scout profiles: ballistics + altitude (extends existing table)
-- ================================================================

ALTER TABLE scout_profiles ADD COLUMN IF NOT EXISTS caliber text;
ALTER TABLE scout_profiles ADD COLUMN IF NOT EXISTS max_effective_range_yards integer;
ALTER TABLE scout_profiles ADD COLUMN IF NOT EXISTS preferred_shot_distance text
  CHECK (preferred_shot_distance IN ('under_200', '200_400', '400_600', '600_plus'));
ALTER TABLE scout_profiles ADD COLUMN IF NOT EXISTS altitude_tolerance text
  CHECK (altitude_tolerance IN ('low', 'moderate', 'high'));

-- ================================================================
-- 3. unit_recommendation_allocations — log AI recs per query
-- ================================================================

CREATE TABLE IF NOT EXISTS unit_recommendation_allocations (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  query_id     uuid REFERENCES scout_queries(id) ON DELETE SET NULL,
  state        text NOT NULL,
  species      text NOT NULL,
  weapon_type  text NOT NULL,
  unit_number  text NOT NULL,
  composite_score numeric(6,4),
  rank         integer,
  was_clicked  boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_unit_rec_user_id ON unit_recommendation_allocations (user_id);
CREATE INDEX IF NOT EXISTS idx_unit_rec_state_species ON unit_recommendation_allocations (state, species);

ALTER TABLE unit_recommendation_allocations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Users view own unit recs" ON unit_recommendation_allocations
    FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service role inserts unit recs" ON unit_recommendation_allocations
    FOR INSERT WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ================================================================
-- 4. party_hunt_rooms + members — viral group draw engine
-- ================================================================

CREATE TABLE IF NOT EXISTS party_hunt_rooms (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_user_id   uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  state           text NOT NULL,
  species         text NOT NULL,
  weapon_type     text NOT NULL,
  target_year     integer NOT NULL DEFAULT date_part('year', now())::integer,
  invite_code     text UNIQUE NOT NULL DEFAULT substr(md5(random()::text), 1, 8),
  status          text CHECK (status IN ('open', 'locked', 'expired')) DEFAULT 'open',
  best_unit       text,  -- populated when group strategy is calculated
  group_odds      numeric(5,2),
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS party_hunt_members (
  id         uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id    uuid REFERENCES party_hunt_rooms(id) ON DELETE CASCADE NOT NULL,
  user_id    uuid REFERENCES users(id) ON DELETE CASCADE,
  email      text,   -- for invited non-users
  points     integer DEFAULT 0,
  joined_at  timestamptz DEFAULT now(),
  UNIQUE (room_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_party_rooms_invite_code ON party_hunt_rooms (invite_code);
CREATE INDEX IF NOT EXISTS idx_party_rooms_owner ON party_hunt_rooms (owner_user_id);
CREATE INDEX IF NOT EXISTS idx_party_members_room_id ON party_hunt_members (room_id);

ALTER TABLE party_hunt_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE party_hunt_members ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Room owners manage their rooms" ON party_hunt_rooms
    FOR ALL USING (auth.uid() = owner_user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Members can view rooms they belong to" ON party_hunt_rooms
    FOR SELECT USING (
      id IN (SELECT room_id FROM party_hunt_members WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users manage own party membership" ON party_hunt_members
    FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Room members can view all members in their room" ON party_hunt_members
    FOR SELECT USING (
      room_id IN (SELECT room_id FROM party_hunt_members WHERE user_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ================================================================
-- 5. state_regulatory_overrides — per-state rule exceptions
-- ================================================================

CREATE TABLE IF NOT EXISTS state_regulatory_overrides (
  id             uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  state          text NOT NULL,
  species        text,         -- NULL = applies to all species in this state
  weapon_type    text,         -- NULL = applies to all weapon types
  rule_type      text NOT NULL CHECK (rule_type IN (
    'point_system',    -- e.g. 'preference' vs 'bonus'
    'residency',       -- residency requirement note
    'bonus_point',     -- bonus point system detail
    'deadline',        -- application deadline date
    'otc_available',   -- over-the-counter availability
    'notes'            -- general regulatory note
  )),
  rule_value     text NOT NULL,
  display_note   text,          -- shown to hunters in Scout UI
  effective_year integer,
  UNIQUE (state, species, weapon_type, rule_type, effective_year)
);

CREATE INDEX IF NOT EXISTS idx_state_reg_overrides_state ON state_regulatory_overrides (state);

ALTER TABLE state_regulatory_overrides ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  CREATE POLICY "Public can read regulatory overrides" ON state_regulatory_overrides
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Seed: core regulatory notes for the 7 launch states
INSERT INTO state_regulatory_overrides (state, species, weapon_type, rule_type, rule_value, display_note, effective_year)
VALUES
  ('Colorado', NULL, NULL, 'point_system', 'preference',
   'Colorado uses preference points, not bonus points. Each unsuccessful application adds 1 point.', 2026),
  ('Colorado', NULL, NULL, 'deadline', 'April 1',
   'Colorado draw applications typically close April 1. Check CPW for exact dates.', 2026),
  ('Wyoming', NULL, NULL, 'point_system', 'bonus',
   'Wyoming uses a bonus point system — each unsuccessful application squares your points for draw weight.', 2026),
  ('Wyoming', NULL, NULL, 'deadline', 'May 31',
   'Wyoming draw applications typically close May 31.', 2026),
  ('Montana', NULL, NULL, 'point_system', 'preference',
   'Montana uses preference points. Points are species-specific.', 2026),
  ('Montana', NULL, NULL, 'deadline', 'June 1',
   'Montana draw applications typically close June 1 for most species.', 2026),
  ('Utah', NULL, NULL, 'point_system', 'bonus',
   'Utah uses a weighted random draw (bonus points). More points = more entries, not guaranteed draw.', 2026),
  ('Utah', NULL, NULL, 'deadline', 'February 15',
   'Utah draw applications typically close February 15.', 2026),
  ('Idaho', NULL, NULL, 'point_system', 'preference',
   'Idaho uses preference points for controlled hunts. OTC tags available for general deer/elk.', 2026),
  ('Idaho', NULL, NULL, 'deadline', 'December 1',
   'Idaho draw applications for the following year close approximately December 1.', 2026),
  ('Arizona', NULL, NULL, 'point_system', 'bonus',
   'Arizona uses a weighted bonus point system. Each unsuccessful application adds 1 bonus point, squaring your odds.', 2026),
  ('Arizona', NULL, NULL, 'deadline', 'February 10',
   'Arizona draw applications typically close February 10.', 2026),
  ('Nevada', NULL, NULL, 'point_system', 'bonus',
   'Nevada uses bonus points. Bonus points are species-specific and do not transfer between species.', 2026),
  ('Nevada', NULL, NULL, 'deadline', 'January 31',
   'Nevada draw applications typically close January 31.', 2026)
ON CONFLICT (state, species, weapon_type, rule_type, effective_year) DO NOTHING;

-- ================================================================
-- 6. Listings: listing_type + landowner columns
-- ================================================================

ALTER TABLE listings ADD COLUMN IF NOT EXISTS listing_type text
  CHECK (listing_type IN ('guided_hunt', 'trespass_fee', 'private_land'))
  DEFAULT 'guided_hunt';
ALTER TABLE listings ADD COLUMN IF NOT EXISTS landowner_verified boolean DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS acreage integer;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS geo_fuzzing_enabled boolean DEFAULT true;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS priority_access boolean DEFAULT false;

-- ================================================================
-- 7. escrow_ledger — double-entry bookkeeping for deposits
-- ================================================================

CREATE TABLE IF NOT EXISTS escrow_ledger (
  id                    uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id            uuid REFERENCES bookings(id) ON DELETE SET NULL,
  event_type            text NOT NULL CHECK (event_type IN (
    'deposit_received',
    'deposit_held',
    'deposit_released',
    'deposit_refunded',
    'payout_initiated',
    'payout_completed',
    'platform_fee_collected'
  )),
  debit_account         text NOT NULL,  -- 'hunter' | 'platform' | 'outfitter' | 'stripe'
  credit_account        text NOT NULL,
  amount_cents          integer NOT NULL CHECK (amount_cents > 0),
  platform_fee_cents    integer DEFAULT 0,
  outfitter_payout_cents integer DEFAULT 0,
  stripe_transfer_id    text,
  stripe_payment_intent text,
  notes                 text,
  created_at            timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_escrow_booking_id ON escrow_ledger (booking_id);
CREATE INDEX IF NOT EXISTS idx_escrow_event_type ON escrow_ledger (event_type);

ALTER TABLE escrow_ledger ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  -- Hunters can view ledger entries for their own bookings
  CREATE POLICY "Hunters view own escrow entries" ON escrow_ledger
    FOR SELECT USING (
      booking_id IN (SELECT id FROM bookings WHERE hunter_id = auth.uid())
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Service role manages escrow" ON escrow_ledger
    FOR ALL USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ================================================================
-- 8. outfitter_profiles: bookings count + commission tracking
-- ================================================================

ALTER TABLE outfitter_profiles ADD COLUMN IF NOT EXISTS bookings_completed_count integer DEFAULT 0;
ALTER TABLE outfitter_profiles ADD COLUMN IF NOT EXISTS stripe_connect_account_id text;
ALTER TABLE outfitter_profiles ADD COLUMN IF NOT EXISTS stripe_connect_onboarded boolean DEFAULT false;
ALTER TABLE outfitter_profiles ADD COLUMN IF NOT EXISTS pilot_bookings_remaining integer DEFAULT 3;
