export type UserRole = 'hunter' | 'outfitter' | 'admin'
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled'
export type BookingType = 'instant' | 'request'
export type CancellationPolicy = 'flexible' | 'moderate' | 'strict'
export type AccessType = 'public' | 'private' | 'high_fence' | 'mixed'
export type ScoutSubscriptionStatus = 'none' | 'active' | 'cancelled'

export type UserProfile = {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  scout_subscription_status: ScoutSubscriptionStatus
  scout_current_period_end: string | null
  scout_stripe_customer_id: string | null
  scout_stripe_subscription_id: string | null
  created_at: string
}

export type OutfitterProfile = {
  id: string
  user_id: string
  business_name: string
  state: string
  license_number: string | null
  license_verified: boolean
  years_in_operation: number | null
  bio: string | null
  success_rate: number | null
  guide_ratio: string | null
  response_time_hours: number | null
  instant_booking_enabled: boolean
  founding_outfitter: boolean
  commission_rate: number
}

export type Listing = {
  id: string
  outfitter_id: string
  title: string
  species: string[]
  states: string[]
  weapon_types: string[] | null
  hunt_style: string | null
  access_type: AccessType | null
  terrain_difficulty: number | null
  duration_days: number | null
  group_size_min: number
  group_size_max: number | null
  lodging_type: string | null
  base_price: number
  deposit_amount: number | null
  description: string | null
  success_rate_override: number | null
  is_combination_hunt: boolean
  ada_accessible: boolean
  points_required: boolean
  booking_type: BookingType
  cancellation_policy: CancellationPolicy
  unit: string | null
  photos: string[] | null
  is_active: boolean
  created_at: string
}

export type Booking = {
  id: string
  listing_id: string
  hunter_id: string
  outfitter_id: string
  status: BookingStatus
  start_date: string
  end_date: string
  party_size: number
  total_price: number | null
  deposit_paid: boolean
  deposit_amount: number | null
  booking_type: BookingType
  stripe_payment_intent_id: string | null
  message_to_outfitter: string | null
  created_at: string
}

export type Review = {
  id: string
  booking_id: string
  hunter_id: string
  outfitter_id: string
  rating: number
  body: string | null
  photos: string[] | null
  created_at: string
}

export type ScoutProfile = {
  id: string
  user_id: string
  experience_level: 'beginner' | 'intermediate' | 'expert' | null
  home_state: string | null
  strategy: 'burn' | 'protect' | 'flexible' | null
  timeline: 'this_year' | '2_3_years' | 'whenever' | null
  group_hunting: boolean
  group_size: number | null
  terrain_preference: 'high_country' | 'flat' | 'mixed' | 'no_preference' | null
  fitness_level: 'light' | 'moderate' | 'strenuous' | null
  physical_limitations: string | null
  goal: 'trophy' | 'meat' | 'both' | null
  first_time_species: boolean | null
  ever_drawn: boolean | null
  ever_guided: boolean | null
  guide_preference: 'solo' | 'guided' | 'either' | null
  budget_range: string | null
  alert_odds_change: boolean
  alert_deadline: boolean
  completed: boolean
  created_at: string
  updated_at: string
}

export type ScoutPoints = {
  id: string
  user_id: string
  state: string
  species: string
  weapon_type: string
  points: number
  years_applying: number
  is_primary: boolean
  created_at: string
}

export type DrawOdds = {
  id: string
  state: string
  species: string
  unit_number: string
  weapon_type: string
  year: number
  total_applicants: number | null
  successful_draws: number | null
  draw_odds_percent: number | null
  avg_points_drawn: number | null
  min_points_drawn: number | null
}
