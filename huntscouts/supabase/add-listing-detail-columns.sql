-- Sessions 3, 4, and 7-partial from HuntScout_Listing_Page_Prompts.docx
-- Run in Supabase SQL editor after add-cancellation-policy.sql

-- Session 3: hunt detail columns on listings
ALTER TABLE listings ADD COLUMN IF NOT EXISTS video_url text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS itinerary jsonb;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS gear_provided text[];
ALTER TABLE listings ADD COLUMN IF NOT EXISTS gear_required text[];
ALTER TABLE listings ADD COLUMN IF NOT EXISTS fitness_description text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS typical_shot_distance text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS land_split text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS meat_handling text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS lodging_photos text[];
ALTER TABLE listings ADD COLUMN IF NOT EXISTS lodging_description text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS nearest_airport text;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS drive_time_to_camp text;

-- Session 5: review enrichment columns
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS weapon_type text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS species text;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS outfitter_response text;

-- Session 4: outfitter profile enhancements
ALTER TABLE outfitter_profiles ADD COLUMN IF NOT EXISTS profile_photo_url text;
ALTER TABLE outfitter_profiles ADD COLUMN IF NOT EXISTS guide_video_url text;
ALTER TABLE outfitter_profiles ADD COLUMN IF NOT EXISTS guides jsonb;
ALTER TABLE outfitter_profiles ADD COLUMN IF NOT EXISTS insurance_verified boolean DEFAULT false;
ALTER TABLE outfitter_profiles ADD COLUMN IF NOT EXISTS total_hunts_completed integer DEFAULT 0;

-- Session 7-partial: wishlist and alerts
CREATE TABLE IF NOT EXISTS saved_listings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, listing_id)
);

CREATE TABLE IF NOT EXISTS listing_alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  listing_id uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  alert_type text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- RLS for new tables
ALTER TABLE saved_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE listing_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own saved listings"
  ON saved_listings FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users manage own alerts"
  ON listing_alerts FOR ALL USING (auth.uid() = user_id);
