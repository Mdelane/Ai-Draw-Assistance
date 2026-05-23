-- Unit context table — one row per state/species/unit
-- Populated by scripts/generate-unit-context.mjs via Claude API
CREATE TABLE IF NOT EXISTS unit_context (
  id                  uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  state               text NOT NULL,
  species             text NOT NULL,
  unit_number         text NOT NULL,
  trophy_quality      integer CHECK (trophy_quality BETWEEN 1 AND 5),
  public_land_percent integer CHECK (public_land_percent BETWEEN 0 AND 100),
  access_type         text CHECK (access_type IN ('drive-in', 'pack-in', 'fly-in', 'mixed')),
  terrain             text CHECK (terrain IN ('flat', 'rolling', 'mountainous', 'alpine', 'desert', 'mixed')),
  notes               text,
  generated_at        timestamptz DEFAULT now(),
  UNIQUE(state, species, unit_number)
);

-- Index for the join in scoreUnits
CREATE INDEX IF NOT EXISTS unit_context_lookup
  ON unit_context (state, species, unit_number);
