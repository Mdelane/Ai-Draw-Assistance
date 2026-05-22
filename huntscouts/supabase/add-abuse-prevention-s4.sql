-- Abuse prevention Session 4: Booking documentation + chargeback evidence
-- Run before first marketplace booking

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS agreement_url text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hunter_ip_at_booking text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tos_accepted_at timestamptz;

-- Supabase Storage bucket for booking agreements
-- Run this in the Supabase dashboard under Storage > New Bucket
-- Name: booking-agreements
-- Public: false (private — agreements are accessed via signed URLs)
-- Or create via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('booking-agreements', 'booking-agreements', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for the storage bucket
CREATE POLICY "Admins can read agreements"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'booking-agreements'
    AND EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );
