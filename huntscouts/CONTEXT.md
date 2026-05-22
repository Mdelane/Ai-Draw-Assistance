# HuntScouts — Project Context

## What This Is
HuntScouts is a two-sided platform:
1. Marketplace — hunters search/book guided hunts, outfitters list their operations
2. Scout — draw odds table (free) + AI strategy conversation (paid via Stripe subscription)

## Domain
huntscouts.com (owned by a friend, DNS to be pointed at Vercel)

## Stack
- Frontend: Next.js 14, App Router, Tailwind CSS
- Database/Auth: Supabase (PostgreSQL + Supabase Auth)
- Hosting: Vercel
- Payments: Stripe (bookings = one-time charge, Scout = subscription)
- AI: Anthropic Claude API (Scout conversation layer)
- Email: Resend

## Build Status
[Updated 2026-05-21]
- [x] Next.js scaffold
- [x] Packages installed (supabase-js, @supabase/ssr, stripe, stripe-js, @anthropic-ai/sdk)
- [x] CONTEXT.md created
- [x] .env.local template created
- [x] Supabase client files (lib/supabase/client.ts, lib/supabase/server.ts)
- [x] Database schema SQL (supabase/schema.sql — ready to paste)
- [x] Auth — signup, login, logout, middleware, useUser hook, requireUser helper
- [x] Navbar component
- [x] Hunter dashboard (/dashboard)
- [x] Hunter bookings (/dashboard/bookings)
- [x] Outfitter dashboard (/outfitter/dashboard)
- [x] Outfitter listing create form (/outfitter/listings/new)
- [x] Outfitter listings index (/outfitter/listings)
- [x] Outfitter bookings + confirm/decline (/outfitter/bookings)
- [x] Hunter listings search with all filters (/listings)
- [x] Listing detail page (/listings/[id])
- [x] Booking form — request model (/listings/[id]/book)
- [x] Scout draw odds table with filters (/scout)
- [x] Scout AI chat UI (ScoutChat.tsx)
- [x] Scout AI API route (/api/scout/chat)
- [x] Scout Pro upgrade page (/scout/upgrade)
- [x] Scout checkout API (/api/scout/checkout)
- [x] Stripe webhook handler (/api/webhooks/stripe)
- [x] Scoring function (lib/scout/score.ts)
- [x] Homepage (/)
- [x] Outfitter onboarding flow (/outfitter/onboarding)
- [x] Outfitter profile create/edit (/outfitter/profile)
- [x] Outfitter listing edit page (/outfitter/listings/[id]/edit)
- [x] FOIA data import script (scripts/import-draw-odds.mjs)
- [x] Stripe deposit checkout on confirmed bookings
- [x] Pay deposit button on hunter bookings page
- [x] Review submission form (/listings/[id]/review)
- [x] Resend email — all 6 transactional emails wired
- [x] Booking confirm/decline API routes with emails
- [x] Review request cron job (daily via Vercel Cron)
- [x] Admin dashboard + user list + outfitter verification
- [x] Scout outfitter cross-reference (OutfitterCards)
- [x] Photo upload component + Supabase Storage setup
- [x] Listing photo gallery on detail page
- [x] OG metadata on listing detail pages
- [x] Sitemap + robots.txt (includes blog posts)
- [x] 404 + error boundary + loading state
- [x] lib/utils.ts shared helpers
- [x] Middleware — onboarding gate, admin protection
- [x] Zod validation schemas (lib/validations/index.ts)
- [x] Vercel Analytics + Speed Insights added to layout
- [x] Google Analytics 4 script in layout (NEXT_PUBLIC_GA_MEASUREMENT_ID env var)
- [x] GA4 custom events: listing_viewed, booking_started, booking_completed, scout_query_run, scout_upgrade_clicked
- [x] lib/analytics.ts client helper
- [x] Blog section — /blog index + /blog/[slug] dynamic pages (MDX)
- [x] 4 pre-launch articles in content/blog/
- [x] Outfitter apply page — /outfitters/apply (Tally form embed + Cal.com link)
- [x] Signup — handles ?role=outfitter&founding=1 params, founding badge/CTA
- [x] Outfitter onboarding — sets founding_outfitter=true + 7% commission from auth metadata
- [x] globals.css — brand CSS variables + shadcn/ui compatible custom properties
- [ ] Environment variables filled in (waiting for API keys)
- [ ] Tally form ID in /outfitters/apply (replace placeholder)
- [ ] Cal.com link verified (huntscouts/outfitter-onboarding)

## Decisions Made
- Commission: 10% per booking (7% for founding outfitters)
- Scout free: draw odds table only
- Scout paid: $9.99/mo or $59.99/yr — AI conversation + multi-year modeling
- Data source: FOIA from state game agencies (not GoHunt)
- Launch states: CO, WY, MT, UT, ID, AZ, NV
- Using @supabase/ssr (not deprecated @supabase/auth-helpers-nextjs)
- Primary color: dark green #1B4332
- MDX blog uses gray-matter + reading-time; posts live in content/blog/
- Founding outfitter flag stored in Supabase auth user_metadata.founding_outfitter
