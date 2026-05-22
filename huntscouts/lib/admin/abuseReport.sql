-- Run this manually every Monday to audit abuse patterns.
-- Copy/paste into Supabase SQL editor.

SELECT
  (SELECT count(*) FROM abuse_signals WHERE event_type = 'disposable_email_blocked' AND created_at > now() - interval '7 days') AS disposable_emails_blocked_7d,
  (SELECT count(*) FROM abuse_signals WHERE event_type = 'duplicate_device_flagged' AND created_at > now() - interval '7 days') AS devices_flagged_7d,
  (SELECT count(*) FROM abuse_signals WHERE event_type = 'device_soft_blocked' AND created_at > now() - interval '7 days') AS devices_soft_blocked_7d,
  (SELECT count(*) FROM abuse_signals WHERE event_type = 'scout_query' AND (meta->>'allowed')::boolean = false AND created_at > now() - interval '7 days') AS scout_queries_rate_limited_7d;

-- Flagged accounts
SELECT id, email, flag_reason, created_at FROM users WHERE account_flagged = true ORDER BY created_at DESC;

-- Flagged listings (duplicate photos)
SELECT l.id, l.title, op.business_name, l.created_at
FROM listings l
JOIN outfitter_profiles op ON op.id = l.outfitter_id
WHERE l.photo_flag = true
ORDER BY l.created_at DESC;
