-- Abuse prevention Session 1: Email verification, disposable email block, rate limiting
-- Run after add-listing-detail-columns.sql

-- Abuse signals audit table (all sessions write here)
CREATE TABLE IF NOT EXISTS abuse_signals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type text NOT NULL,
  email text,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  meta jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE abuse_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view abuse signals"
  ON abuse_signals FOR SELECT
  USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- Admin insert from service role (API routes use admin client)
-- No RLS for insert — only service-role admin client writes here.

-- Scout query rate limiting
ALTER TABLE users ADD COLUMN IF NOT EXISTS scout_queries_this_month integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS scout_queries_month_reset date DEFAULT current_date;

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_abuse_signals_event_type ON abuse_signals(event_type);
CREATE INDEX IF NOT EXISTS idx_abuse_signals_created_at ON abuse_signals(created_at);
CREATE INDEX IF NOT EXISTS idx_abuse_signals_user_id ON abuse_signals(user_id);
