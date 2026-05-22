-- HuntScouts Database Schema
-- Paste this entire file into Supabase Dashboard → SQL Editor → New Query → Run

-- ============================================================
-- TABLES
-- ============================================================

create table if not exists public.users (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  full_name text,
  role text check (role in ('hunter', 'outfitter', 'admin')) default 'hunter',
  scout_subscription_status text check (scout_subscription_status in ('none', 'active', 'cancelled')) default 'none',
  scout_stripe_customer_id text,
  scout_stripe_subscription_id text,
  scout_current_period_end timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.outfitter_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  business_name text not null,
  state text not null,
  license_number text,
  license_verified boolean default false,
  years_in_operation integer,
  bio text,
  success_rate numeric(5,2),
  guide_ratio text,
  response_time_hours integer,
  instant_booking_enabled boolean default false,
  founding_outfitter boolean default false,
  commission_rate numeric(4,2) default 10.00,
  created_at timestamptz default now()
);

create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  outfitter_id uuid references public.outfitter_profiles(id) on delete cascade,
  title text not null,
  species text[] not null,
  states text[] not null,
  weapon_types text[],
  hunt_style text,
  access_type text check (access_type in ('public', 'private', 'high_fence', 'mixed')),
  terrain_difficulty integer check (terrain_difficulty between 1 and 5),
  duration_days integer,
  group_size_min integer default 1,
  group_size_max integer,
  lodging_type text,
  base_price numeric(10,2) not null,
  deposit_amount numeric(10,2),
  description text,
  success_rate_override numeric(5,2),
  is_combination_hunt boolean default false,
  ada_accessible boolean default false,
  points_required boolean default false,
  booking_type text check (booking_type in ('instant', 'request')) not null,
  unit text,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id),
  hunter_id uuid references public.users(id),
  outfitter_id uuid references public.outfitter_profiles(id),
  status text check (status in ('pending', 'confirmed', 'completed', 'cancelled')) default 'pending',
  start_date date not null,
  end_date date not null,
  party_size integer default 1,
  total_price numeric(10,2),
  deposit_paid boolean default false,
  deposit_amount numeric(10,2),
  booking_type text check (booking_type in ('instant', 'request')) not null,
  stripe_payment_intent_id text,
  message_to_outfitter text,
  created_at timestamptz default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references public.bookings(id) unique,
  hunter_id uuid references public.users(id),
  outfitter_id uuid references public.outfitter_profiles(id),
  rating integer check (rating between 1 and 5) not null,
  body text,
  photos text[],
  created_at timestamptz default now()
);

create table if not exists public.draw_odds (
  id uuid primary key default gen_random_uuid(),
  state text not null,
  species text not null,
  unit_number text not null,
  weapon_type text not null,
  year integer not null,
  total_applicants integer,
  successful_draws integer,
  draw_odds_percent numeric(5,2),
  avg_points_drawn numeric(5,1),
  min_points_drawn integer,
  unique (state, species, unit_number, weapon_type, year)
);

create table if not exists public.scout_queries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id),
  state text not null,
  species text not null,
  points integer not null,
  weapon_type text,
  priority_weights jsonb,
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists listings_outfitter_id_idx on public.listings (outfitter_id);
create index if not exists listings_species_idx on public.listings using gin (species);
create index if not exists listings_states_idx on public.listings using gin (states);
create index if not exists bookings_hunter_id_idx on public.bookings (hunter_id);
create index if not exists bookings_outfitter_id_idx on public.bookings (outfitter_id);
create index if not exists draw_odds_state_species_year_idx on public.draw_odds (state, species, year);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.users enable row level security;
alter table public.outfitter_profiles enable row level security;
alter table public.listings enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;
alter table public.draw_odds enable row level security;
alter table public.scout_queries enable row level security;

-- users: can read/update own row
do $$ begin
  create policy "Users can view own profile" on public.users for select using (auth.uid() = id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users can update own profile" on public.users for update using (auth.uid() = id);
exception when duplicate_object then null; end $$;

-- outfitter_profiles: outfitters manage their own; public can view
do $$ begin
  create policy "Outfitters manage own profile" on public.outfitter_profiles for all using (auth.uid() = user_id);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public can view outfitter profiles" on public.outfitter_profiles for select using (true);
exception when duplicate_object then null; end $$;

-- listings: outfitters manage their own; public can view active listings
do $$ begin
  create policy "Outfitters manage own listings" on public.listings for all
    using (outfitter_id in (select id from public.outfitter_profiles where user_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Public can view active listings" on public.listings for select using (is_active = true);
exception when duplicate_object then null; end $$;

-- bookings: hunters see own bookings; outfitters see bookings for their listings
do $$ begin
  create policy "Hunters view own bookings" on public.bookings for select using (hunter_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Hunters create bookings" on public.bookings for insert with check (hunter_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Outfitters view their bookings" on public.bookings for select
    using (outfitter_id in (select id from public.outfitter_profiles where user_id = auth.uid()));
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Outfitters update their bookings" on public.bookings for update
    using (outfitter_id in (select id from public.outfitter_profiles where user_id = auth.uid()));
exception when duplicate_object then null; end $$;

-- reviews: public read; hunters create own
do $$ begin
  create policy "Public can view reviews" on public.reviews for select using (true);
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Hunters create own reviews" on public.reviews for insert with check (hunter_id = auth.uid());
exception when duplicate_object then null; end $$;

-- draw_odds: public read
do $$ begin
  create policy "Public can view draw odds" on public.draw_odds for select using (true);
exception when duplicate_object then null; end $$;

-- scout_queries: users see own queries
do $$ begin
  create policy "Users view own scout queries" on public.scout_queries for select using (user_id = auth.uid());
exception when duplicate_object then null; end $$;
do $$ begin
  create policy "Users create scout queries" on public.scout_queries for insert with check (user_id = auth.uid());
exception when duplicate_object then null; end $$;

-- ============================================================
-- USER CREATION TRIGGER
-- Creates a row in public.users when someone signs up via Supabase Auth
-- ============================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    coalesce(new.raw_user_meta_data->>'role', 'hunter')
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
