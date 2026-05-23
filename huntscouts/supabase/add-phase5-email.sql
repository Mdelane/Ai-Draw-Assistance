ALTER TABLE users ADD COLUMN IF NOT EXISTS nurture_stage integer DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_unsubscribed boolean DEFAULT false;
