-- Abuse prevention Session 3: Stripe card-on-file + Scout trial
-- Run before first Scout paid subscriber

ALTER TABLE users ADD COLUMN IF NOT EXISTS scout_status text
  CHECK (scout_status IN ('free', 'trial', 'active', 'cancelled'))
  DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS scout_trial_start timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS scout_trial_end timestamptz;
ALTER TABLE users ADD COLUMN IF NOT EXISTS scout_trial_queries_used integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_payment_method_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_customer_id text;
ALTER TABLE users ADD COLUMN IF NOT EXISTS stripe_subscription_id text;

-- Find trials past their end date (run manually daily until cron is set up)
-- SELECT id, email FROM users WHERE scout_status = 'trial' AND scout_trial_end < now();
