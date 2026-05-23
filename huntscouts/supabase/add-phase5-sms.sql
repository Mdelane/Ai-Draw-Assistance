ALTER TABLE scout_profiles ADD COLUMN IF NOT EXISTS phone_number text;
ALTER TABLE scout_profiles ADD COLUMN IF NOT EXISTS sms_opt_in boolean DEFAULT false;
