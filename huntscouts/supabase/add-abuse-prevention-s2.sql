-- Abuse prevention Session 2: Device fingerprinting + listing protection
-- Run after add-abuse-prevention-s1.sql
-- Requires: npm install @thumbmarkjs/thumbmarkjs

-- Device fingerprint on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS device_fingerprint text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS fingerprint_collected_at timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS account_flagged boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS flag_reason text;

-- Outfitter cooling period tracking
ALTER TABLE outfitter_profiles ADD COLUMN IF NOT EXISTS completed_bookings_count integer DEFAULT 0;
ALTER TABLE outfitter_profiles ADD COLUMN IF NOT EXISTS wants_instant_booking boolean DEFAULT false;

-- Photo duplicate flag on listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS photo_flag boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_device_fingerprint ON users(device_fingerprint);
CREATE INDEX IF NOT EXISTS idx_users_account_flagged ON users(account_flagged);
