-- HuntScouts seed data for local development
-- Run AFTER schema.sql
-- Creates test users, outfitter profiles, listings, and draw odds

-- NOTE: These UUIDs are fixed for dev. Do not use in production.

-- ============================================================
-- TEST USERS (passwords are all: Password123!)
-- Create via Supabase Auth Dashboard, then these rows auto-insert via trigger.
-- OR insert directly if trigger is set up:
-- ============================================================

-- Test hunter
insert into public.users (id, email, full_name, role) values
  ('00000000-0000-0000-0000-000000000001', 'hunter@test.com', 'Jake Hunter', 'hunter')
on conflict (id) do nothing;

-- Test outfitter
insert into public.users (id, email, full_name, role) values
  ('00000000-0000-0000-0000-000000000002', 'outfitter@test.com', 'Mike Outfitter', 'outfitter')
on conflict (id) do nothing;

-- Test admin
insert into public.users (id, email, full_name, role) values
  ('00000000-0000-0000-0000-000000000003', 'admin@test.com', 'Admin User', 'admin')
on conflict (id) do nothing;

-- ============================================================
-- OUTFITTER PROFILE
-- ============================================================

insert into public.outfitter_profiles (
  id, user_id, business_name, state, license_number, license_verified,
  years_in_operation, bio, success_rate, guide_ratio, response_time_hours,
  instant_booking_enabled, founding_outfitter, commission_rate
) values (
  '00000000-0000-0000-0000-000000000010',
  '00000000-0000-0000-0000-000000000002',
  'Rocky Mountain Trophy Hunts',
  'CO',
  'CO-OL-2024-0042',
  true,
  15,
  'Family-owned operation running remote elk and mule deer hunts in western Colorado for 15 years. We pride ourselves on fair chase, spot-and-stalk hunts in high-country wilderness.',
  78.5,
  '1:1',
  24,
  false,
  true,
  7.00
) on conflict (id) do nothing;

-- ============================================================
-- LISTINGS
-- ============================================================

insert into public.listings (
  id, outfitter_id, title, species, states, weapon_types, hunt_style,
  access_type, terrain_difficulty, duration_days, group_size_min, group_size_max,
  lodging_type, base_price, deposit_amount, description, success_rate_override,
  booking_type, is_active, points_required
) values
(
  '00000000-0000-0000-0000-000000000020',
  '00000000-0000-0000-0000-000000000010',
  '5-Day Archery Elk Hunt — GMU 12',
  array['elk'],
  array['CO'],
  array['archery'],
  'spot-and-stalk',
  'public',
  4,
  5,
  1, 2,
  'spike camp',
  6500.00,
  1000.00,
  'Remote spike camp elk hunt in GMU 12. We pack in 8 miles on horseback to access country that sees almost no hunting pressure. Bulls regularly score 320-360 B&C. This is a true wilderness hunt — physical fitness required.',
  82.0,
  'request',
  true,
  true
),
(
  '00000000-0000-0000-0000-000000000021',
  '00000000-0000-0000-0000-000000000010',
  '3-Day Rifle Mule Deer Hunt — Western Slope',
  array['mule deer'],
  array['CO'],
  array['rifle'],
  'spot-and-stalk',
  'private',
  3,
  3,
  1, 3,
  'ranch house',
  4200.00,
  750.00,
  'OTC rifle mule deer on 22,000 acres of private ranch. Glassing for big bucks from the truck, then stalking on foot. Lodging in a comfortable ranch house with home-cooked meals.',
  71.0,
  'instant',
  true,
  false
),
(
  '00000000-0000-0000-0000-000000000022',
  '00000000-0000-0000-0000-000000000010',
  '7-Day Bighorn Sheep Hunt — Unit 2',
  array['bighorn sheep'],
  array['CO'],
  array['rifle', 'archery'],
  'spot-and-stalk',
  'public',
  5,
  7,
  1, 1,
  'tent camp',
  18000.00,
  3000.00,
  'Once-in-a-lifetime bighorn sheep hunt in Unit 2. This is the hunt you have been saving your points for. We have a 100% kill rate on legal rams over the past 8 years. Sheep hunting is the hardest hunting you will ever do — and the most rewarding.',
  100.0,
  'request',
  true,
  true
)
on conflict (id) do nothing;

-- ============================================================
-- DRAW ODDS — Colorado Elk, Unit 12, Archery (sample data)
-- ============================================================

insert into public.draw_odds (
  state, species, unit_number, weapon_type, year,
  total_applicants, successful_draws, draw_odds_percent,
  avg_points_drawn, min_points_drawn
) values
  ('CO', 'elk', '12', 'archery', 2024, 1240, 87, 7.0, 4.2, 2),
  ('CO', 'elk', '12', 'archery', 2023, 1180, 90, 7.6, 3.8, 1),
  ('CO', 'elk', '12', 'archery', 2022, 1050, 95, 9.0, 3.1, 0),
  ('CO', 'elk', '2', 'archery', 2024, 3200, 44, 1.4, 12.1, 9),
  ('CO', 'elk', '2', 'archery', 2023, 2980, 47, 1.6, 11.4, 8),
  ('CO', 'elk', '2', 'archery', 2022, 2750, 50, 1.8, 10.9, 8),
  ('CO', 'elk', '23', 'archery', 2024, 420, 112, 26.7, 1.2, 0),
  ('CO', 'elk', '23', 'archery', 2023, 390, 108, 27.7, 1.0, 0),
  ('CO', 'elk', '23', 'archery', 2022, 350, 100, 28.6, 0.8, 0),
  ('CO', 'elk', '61', 'archery', 2024, 890, 62, 7.0, 5.8, 4),
  ('CO', 'elk', '61', 'archery', 2023, 820, 68, 8.3, 5.2, 3),
  ('CO', 'elk', '501', 'archery', 2024, 2100, 28, 1.3, 14.2, 11),
  ('CO', 'elk', '501', 'archery', 2023, 1950, 31, 1.6, 13.6, 11),
  ('CO', 'mule deer', '12', 'rifle', 2024, 3400, 510, 15.0, 2.1, 0),
  ('CO', 'mule deer', '2', 'rifle', 2024, 780, 39, 5.0, 6.4, 5),
  ('CO', 'mule deer', '23', 'rifle', 2024, 450, 180, 40.0, 0.2, 0),
  ('CO', 'bighorn sheep', '2', 'rifle', 2024, 8900, 9, 0.1, 22.4, 18),
  ('CO', 'bighorn sheep', '2', 'rifle', 2023, 8400, 9, 0.1, 21.8, 17),
  ('WY', 'elk', 'G', 'archery', 2024, 560, 112, 20.0, 0.5, 0),
  ('WY', 'elk', 'H', 'archery', 2024, 1200, 48, 4.0, 4.2, 3),
  ('WY', 'mule deer', '30', 'rifle', 2024, 320, 96, 30.0, 0.0, 0),
  ('MT', 'elk', '380', 'archery', 2024, 240, 72, 30.0, 0.0, 0),
  ('MT', 'elk', '316', 'rifle', 2024, 890, 89, 10.0, 1.8, 0)
on conflict (state, species, unit_number, weapon_type, year) do nothing;
