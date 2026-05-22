-- Scout profile questionnaire tables
-- Run in Supabase SQL editor after existing migrations

-- One profile per user — stores all questionnaire answers
CREATE TABLE IF NOT EXISTS scout_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  experience_level text CHECK (experience_level IN ('beginner', 'intermediate', 'expert')),
  home_state text,
  strategy text CHECK (strategy IN ('burn', 'protect', 'flexible')),
  timeline text CHECK (timeline IN ('this_year', '2_3_years', 'whenever')),
  group_hunting boolean DEFAULT false,
  group_size integer,
  terrain_preference text CHECK (terrain_preference IN ('high_country', 'flat', 'mixed', 'no_preference')),
  fitness_level text CHECK (fitness_level IN ('light', 'moderate', 'strenuous')),
  physical_limitations text,
  goal text CHECK (goal IN ('trophy', 'meat', 'both')),
  first_time_species boolean,
  ever_drawn boolean,
  ever_guided boolean,
  guide_preference text CHECK (guide_preference IN ('solo', 'guided', 'either')),
  budget_range text,
  alert_odds_change boolean DEFAULT false,
  alert_deadline boolean DEFAULT false,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Unlimited state/species/weapon/points combos per user
CREATE TABLE IF NOT EXISTS scout_points (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  state text NOT NULL,
  species text NOT NULL,
  weapon_type text NOT NULL,
  points integer NOT NULL DEFAULT 0,
  years_applying integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Track free query usage and onboarding state on users
ALTER TABLE users ADD COLUMN IF NOT EXISTS scout_free_query_used boolean DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS scout_onboarding_dismissed boolean DEFAULT false;

-- RLS
ALTER TABLE scout_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_points ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Users manage own scout profile" ON scout_profiles FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Users manage own scout points" ON scout_points FOR ALL USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_scout_points_user_id ON scout_points(user_id);
CREATE INDEX IF NOT EXISTS idx_scout_profiles_user_id ON scout_profiles(user_id);
