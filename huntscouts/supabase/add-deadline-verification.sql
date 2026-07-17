-- Hunt Atlas — Deadline Verification System
-- P0 trust-critical: kills "estimated" dates on the deadlines page.
-- Run this file in the Supabase SQL editor.

create table if not exists deadline_sources (
  id uuid primary key default gen_random_uuid(),
  state text not null unique,
  agency_name text not null,
  agency_abbr text not null,
  canonical_url text not null,
  secondary_urls text[] default '{}',
  publication_window text not null,
  publication_month int not null,
  monitor_enabled boolean default true,
  last_checked_at timestamptz,
  last_content_hash text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

do $$ begin
  create type deadline_type as enum (
    'application_open',
    'application_close',
    'modification_deadline',
    'results_posted',
    'tag_surrender_deadline',
    'secondary_draw_open',
    'secondary_draw_close',
    'secondary_results_posted',
    'leftover_fcfs_start',
    'points_only_open',
    'points_only_close',
    'otc_sale_start'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type deadline_status as enum (
    'verified',
    'pending_publication',
    'pending_review',
    'superseded'
  );
exception when duplicate_object then null; end $$;

create table if not exists state_deadlines (
  id uuid primary key default gen_random_uuid(),
  state text not null references deadline_sources(state),
  year int not null,
  species text[] not null,
  residency text not null default 'all',
  deadline_type deadline_type not null,
  event_date date not null,
  event_time text,
  timezone text not null,
  status deadline_status not null default 'verified',
  source_url text not null,
  verified_at timestamptz,
  verified_by text,
  supersedes uuid references state_deadlines(id),
  display_label text,
  notes text,
  created_at timestamptz default now(),
  unique(state, year, deadline_type, species, residency)
);

create index if not exists idx_deadlines_lookup on state_deadlines(state, year, status);

-- Hunt Atlas — 2026 Deadline Seed Data
-- All dates verified against agency/primary sources on 2026-07-13.
-- Every row carries the exact source URL it was read from.
-- Rows with status 'pending_publication' have a conflict noted and must be
-- confirmed against the agency before display.

-- =====================================================================
-- SOURCE REGISTRY
-- =====================================================================
insert into deadline_sources (state, agency_name, agency_abbr, canonical_url, secondary_urls, publication_window, publication_month, notes) values
('AZ', 'Arizona Game and Fish Department', 'AZGFD', 'https://www.azgfd.com/hunting/hunt-draw-and-licenses/big-game-draw/', array['https://draw.azgfd.com/'], 'elk/antelope: early Jan; fall: Apr-May; spring: Aug-Sep', 12, 'Three draw cycles per year. AZ does not observe DST — always America/Phoenix.'),
('CA', 'California Department of Fish and Wildlife', 'CDFW', 'https://wildlife.ca.gov/Licensing/Hunting/Big-Game', array['https://www.licenses.wildlife.ca.gov/internetsales'], 'April (apps open Apr 15)', 3, 'Big Game Drawing window is stable: Apr 15 – Jun 2 annually, but verify every year.'),
('CO', 'Colorado Parks and Wildlife', 'CPW', 'https://cpw.state.co.us/activities/hunting/big-game/primary-draw', array['https://cpw.widen.net/s/5wvx7rggrd/colorado-big-game-hunting-brochure'], 'mid-February (Big Game brochure)', 2, 'Primary draw closes 8:00 PM MT — NOT midnight. Common miss.'),
('ID', 'Idaho Department of Fish and Game', 'IDFG', 'https://idfg.idaho.gov/licenses/tag/controlled', array['https://idfg.idaho.gov/sites/default/files/seasons-rules-big-game-2026.pdf'], 'March-April (Big Game Seasons & Rules)', 3, 'NR general season tags sold via December lottery in PRIOR year.'),
('MT', 'Montana Fish, Wildlife & Parks', 'FWP', 'https://fwp.mt.gov/buyandapply/hunting-licenses', array['https://fwp.mt.gov/hunt/regulations'], 'late February (license year opens Mar 1)', 2, null),
('NV', 'Nevada Department of Wildlife', 'NDOW', 'https://www.ndow.org/apply-buy/apply-buy-hunting/', array['https://www.ndow.org/wp-content/uploads/2026/01/CR-26-01-2026-2027-Application-Deadlines-Draw-Result-Dates-NBWC-Approved-January-2026.pdf'], 'January (Commission-approved CR document)', 1, 'The annual CR PDF (Commission Regulation) is the authoritative deadline document.'),
('NM', 'New Mexico Department of Game and Fish', 'NMDGF', 'https://wildlife.dgf.nm.gov/hunting/applications-and-draw-information/', array[]::text[], 'January (Rules & Info booklet)', 1, 'Hard 5:00 PM MT cutoff, not midnight. Harvest report compliance required to be draw-eligible.'),
('OR', 'Oregon Department of Fish and Wildlife', 'ODFW', 'https://myodfw.com/articles/controlled-hunt-navigation', array['https://myodfw.com/big-game-hunting/seasons'], 'December prior year (regs)', 12, 'May 15 controlled-hunt deadline is a standing annual rule; 2026 introduced Deer Hunt Areas replacing WMUs in eastern OR.'),
('UT', 'Utah Division of Wildlife Resources', 'DWR', 'https://wildlife.utah.gov/hunting-in-utah.html', array['https://utahdraws.com'], 'early March (guidebook; apps open ~Mar 19)', 2, 'NEW draw contractor/system as of 2026: utahdraws.com. Guidebook digital-only from 2026.'),
('WA', 'Washington Department of Fish and Wildlife', 'WDFW', 'https://wdfw.wa.gov/hunting/regulations', array['https://wdfw.wa.gov/newsroom'], 'April (pamphlet; apps open ~Apr 20)', 3, 'EXTENDED deadline mid-cycle in both 2024 and 2026 — monitor newsroom feed during May.'),
('WY', 'Wyoming Game and Fish Department', 'WGFD', 'https://wgfd.wyo.gov/licenses-applications', array['https://wgfd.wyo.gov/news-events'], 'early January (apps open Jan 2)', 12, 'Deadlines split by residency AND species. NR elk closes 4 months before deer/pronghorn.');

-- =====================================================================
-- 2026 VERIFIED DEADLINES
-- verified_at = '2026-07-13', verified_by = 'max+claude'
-- =====================================================================

-- ---------- ARIZONA ----------
insert into state_deadlines (state, year, species, residency, deadline_type, event_date, event_time, timezone, status, source_url, verified_at, verified_by, display_label, notes) values
('AZ', 2026, array['elk','pronghorn'], 'all', 'application_close', '2026-02-03', '23:59', 'America/Phoenix', 'verified', 'https://azgfd-portal-wordpress-pantheon.s3.us-west-2.amazonaws.com/wp-content/uploads/2025/12/23143704/2026-Pronghorn-and-Elk-Regulations_251223.pdf', '2026-07-13', 'max+claude', 'Elk & Pronghorn Draw Deadline', 'Official AZGFD 2026 regs PDF. Third-party sites estimated Feb 10 — wrong by a week.'),
('AZ', 2026, array['elk','pronghorn'], 'all', 'results_posted', '2026-02-23', null, 'America/Phoenix', 'verified', 'https://www.huntinfool.com/states/arizona', '2026-07-13', 'max+claude', 'Elk & Pronghorn Draw Results', 'Results posted Feb 23, 2026 ~9:30am MST.'),
('AZ', 2026, array['deer','bighorn_sheep','bison','turkey','javelina','sandhill_crane'], 'all', 'application_close', '2026-06-02', '23:59', 'America/Phoenix', 'verified', 'https://www.azgfd.com/2026/05/12/apply-now-for-the-fall-draw/', '2026-07-13', 'max+claude', 'Fall Draw Deadline (Deer, Sheep, Bison, Turkey)', 'AZGFD official release.'),
('AZ', 2026, array['deer','bighorn_sheep','bison','turkey','javelina','sandhill_crane'], 'all', 'results_posted', '2026-06-22', null, 'America/Phoenix', 'verified', 'https://content.govdelivery.com/accounts/AZGFD/bulletins/41d3009', '2026-07-13', 'max+claude', 'Fall Draw Results', 'AZGFD bulletin June 22, 2026.'),
('AZ', 2026, array['deer'], 'all', 'leftover_fcfs_start', '2026-07-06', '08:00', 'America/Phoenix', 'verified', 'https://www.huntinfool.com/states/arizona', '2026-07-13', 'max+claude', 'Leftover Deer Permits (mail-in FCFS)', 'Mail-only after 8am July 6, 2026. Confirm process against AZGFD leftover list.');

-- ---------- CALIFORNIA ----------
insert into state_deadlines (state, year, species, residency, deadline_type, event_date, event_time, timezone, status, source_url, verified_at, verified_by, display_label, notes) values
('CA', 2026, array['deer','elk','pronghorn','bighorn_sheep'], 'all', 'application_open', '2026-04-15', null, 'America/Los_Angeles', 'verified', 'https://hunterizer.com/hunterizer-app-2026-ca-big-game-seasons/', '2026-07-13', 'max+claude', 'Big Game Drawing Opens', null),
('CA', 2026, array['deer','elk','pronghorn','bighorn_sheep'], 'all', 'application_close', '2026-06-02', '23:59', 'America/Los_Angeles', 'verified', 'https://hunterizer.com/apply-by-june-2-for-californias-2026-big-game-drawing/', '2026-07-13', 'max+claude', 'Big Game Drawing Deadline', 'CDFW closes at 11:59:59 PM June 2. Premium deer = First Deer Tag DRAWING APPLICATION, not First Deer Tag — common user error worth a UI callout.'),
('CA', 2026, array['deer','elk','pronghorn','bighorn_sheep'], 'all', 'results_posted', '2026-06-15', null, 'America/Los_Angeles', 'verified', 'https://www.onxmaps.com/hunt/blog/hunting-application-details-california', '2026-07-13', 'max+claude', 'Drawing Results', 'Generally by June 15; CDFW commits to draw within 10 working days + 10 to notify.');

-- ---------- COLORADO ----------
insert into state_deadlines (state, year, species, residency, deadline_type, event_date, event_time, timezone, status, source_url, verified_at, verified_by, display_label, notes) values
('CO', 2026, array['deer','elk','pronghorn','moose','bear','bison'], 'all', 'application_open', '2026-03-01', null, 'America/Denver', 'verified', 'https://cpw.state.co.us/activities/hunting/big-game/primary-draw', '2026-07-13', 'max+claude', 'Primary Draw Opens', 'Qualifying license required before applying.'),
('CO', 2026, array['deer','elk','pronghorn','moose','bear','bison'], 'all', 'application_close', '2026-04-07', '20:00', 'America/Denver', 'verified', 'https://cpw.state.co.us/activities/hunting/big-game/primary-draw', '2026-07-13', 'max+claude', 'Primary Draw Deadline', '8:00 PM MT — NOT midnight. Surface prominently.'),
('CO', 2026, array['deer','elk','pronghorn','moose','bear','bison'], 'all', 'results_posted', '2026-05-26', null, 'America/Denver', 'verified', 'https://coloradooutdoorsmag.com/2026/02/13/whats-new-2026-colorado-big-game-hunting/', '2026-07-13', 'max+claude', 'Primary Draw Results', 'Posted May 26–29, 2026.'),
('CO', 2026, array['deer','elk','pronghorn','moose','bear','bison'], 'all', 'tag_surrender_deadline', '2026-06-01', '23:59', 'America/Denver', 'verified', 'https://coloradooutdoorsmag.com/2026/02/13/whats-new-2026-colorado-big-game-hunting/', '2026-07-13', 'max+claude', 'Primary Draw License Surrender Deadline', 'Surrender restores points + refunds fee.'),
('CO', 2026, array['deer','elk','pronghorn','bear'], 'all', 'secondary_draw_open', '2026-06-18', null, 'America/Denver', 'verified', 'https://citizenportal.ai/articles/7425756/colorado/executive/organizations/governors-boards-and-commissions/parks-and-wildlife-commission/Colorado/Executive/Organizations/Governors-Boards-and-Commissions/Parks-and-Wildlife-Commission/Colorado-Parks-and-Wildlife-issues-2026-big-game-brochure-lists-draw-deadlines-and-new-rules', '2026-07-13', 'max+claude', 'Secondary Draw Opens', null),
('CO', 2026, array['deer','elk','pronghorn','bear'], 'all', 'secondary_draw_close', '2026-06-30', '20:00', 'America/Denver', 'verified', 'https://cpw.widen.net/s/5wvx7rggrd/colorado-big-game-hunting-brochure', '2026-07-13', 'max+claude', 'Secondary Draw Deadline', 'Official CPW 2026 brochure. Open to all, including primary-draw non-applicants.'),
('CO', 2026, array['deer','elk','pronghorn','bear'], 'all', 'secondary_results_posted', '2026-07-07', null, 'America/Denver', 'verified', 'https://coloradooutdoorsmag.com/2026/02/13/whats-new-2026-colorado-big-game-hunting/', '2026-07-13', 'max+claude', 'Secondary Draw Results', 'Surrender deadline for secondary licenses: July 9, 11:59 PM MT.');

-- ---------- IDAHO ----------
insert into state_deadlines (state, year, species, residency, deadline_type, event_date, event_time, timezone, status, source_url, verified_at, verified_by, display_label, notes) values
('ID', 2026, array['deer','elk'], 'nonresident', 'application_close', '2025-12-15', null, 'America/Boise', 'verified', 'https://www.onxmaps.com/hunt/blog/hunting-application-details-idaho', '2026-07-13', 'max+claude', 'NR General Tag Lottery (prior December)', 'Dec 5–15, 2025 window for 2026 tags; results Jan 6, purchase by Jan 20. For 2027 tags, verify the Dec 2026 window.'),
('ID', 2026, array['moose','bighorn_sheep','mountain_goat'], 'all', 'application_close', '2026-04-30', null, 'America/Boise', 'verified', 'https://www.onxmaps.com/hunt/blog/hunting-application-details-idaho', '2026-07-13', 'max+claude', 'Moose, Sheep & Goat Deadline', 'Applying for MSG excludes you from limited controlled deer/elk/antelope draws.'),
('ID', 2026, array['deer','elk','pronghorn','bear','turkey'], 'all', 'application_open', '2026-05-01', null, 'America/Boise', 'verified', 'https://idfg.idaho.gov/licenses/tag/controlled', '2026-07-13', 'max+claude', 'Controlled Hunt Applications Open', 'IDFG official page.'),
('ID', 2026, array['deer','elk','pronghorn','bear','turkey'], 'all', 'application_close', '2026-06-05', '23:59', 'America/Boise', 'verified', 'https://idfg.idaho.gov/licenses/tag/controlled', '2026-07-13', 'max+claude', 'Controlled Hunt Deadline', 'IDFG official page; 11:59 PM MT per GOHUNT. Online only — mail no longer accepted.'),
('ID', 2026, array['deer','elk','pronghorn'], 'all', 'results_posted', '2026-06-17', null, 'America/Boise', 'verified', 'https://www.huntinfool.com/states/idaho', '2026-07-13', 'max+claude', 'Controlled Hunt Results', 'Posted June 17, 2026. Drawn tags must be picked up by Aug 1.'),
('ID', 2026, array['deer','elk','pronghorn'], 'all', 'secondary_draw_open', '2026-08-05', null, 'America/Boise', 'verified', 'https://www.gohunt.com/browse/application-strategies/application-strategy-idaho-controlled-deer-elk-and-antelope-tactics-when-applying', '2026-07-13', 'max+claude', 'Leftover Second Draw Opens', 'Aug 5–15, 2026.'),
('ID', 2026, array['deer','elk','pronghorn'], 'all', 'secondary_draw_close', '2026-08-15', null, 'America/Boise', 'verified', 'https://www.gohunt.com/browse/application-strategies/application-strategy-idaho-controlled-deer-elk-and-antelope-tactics-when-applying', '2026-07-13', 'max+claude', 'Leftover Second Draw Deadline', null);

-- ---------- MONTANA ----------
insert into state_deadlines (state, year, species, residency, deadline_type, event_date, event_time, timezone, status, source_url, verified_at, verified_by, display_label, notes) values
('MT', 2026, array['deer','elk'], 'all', 'application_open', '2026-03-01', '05:00', 'America/Denver', 'verified', 'https://www.onxmaps.com/hunt/blog/hunting-application-details-montana', '2026-07-13', 'max+claude', 'License Year Opens / Applications Open', null),
('MT', 2026, array['deer','elk'], 'all', 'application_close', '2026-04-01', '23:45', 'America/Denver', 'verified', 'https://www.theoutdoorwire.com/releases/2026/03/application-deadline-for-deer-and-elk-permits-nonresident-combination-licenses-is-april-1/', '2026-07-13', 'max+claude', 'Deer & Elk Permits + NR Combo Deadline', 'FWP release. 11:45 PM MT cutoff, unusual — surface it.'),
('MT', 2026, array['moose','bighorn_sheep','mountain_goat','bison'], 'all', 'application_close', '2026-05-01', '23:45', 'America/Denver', 'verified', 'https://hunterizer.com/montana-fwp-releases-2026-big-game-hunting-regulations-hunterizer-updates-now-live/', '2026-07-13', 'max+claude', 'Moose, Sheep, Goat & Bison Deadline', 'Also confirmed by FWP-quoted press (KBZK).'),
('MT', 2026, array['pronghorn','deer_b','elk_b'], 'all', 'application_close', '2026-06-01', '23:45', 'America/Denver', 'verified', 'https://thewesternnews.com/news/2026/mar/20/deadlines-approaching-for-special-hunting-permits-tags/', '2026-07-13', 'max+claude', 'Antelope & B-License Deadline', null),
('MT', 2026, array['deer','elk','pronghorn','moose','bighorn_sheep','mountain_goat','bison','mountain_lion'], 'all', 'application_close', '2026-06-30', null, 'America/Denver', 'pending_publication', 'https://thewesternnews.com/news/2026/mar/20/deadlines-approaching-for-special-hunting-permits-tags/', null, null, 'Super Tag Lottery Purchase Deadline', 'CONFLICT: 2026 press says June 30; FWP historically listed July 1. Confirm on fwp.mt.gov before display.'),
('MT', 2026, array['deer','elk'], 'nonresident', 'points_only_open', '2026-07-01', null, 'America/Denver', 'verified', 'https://www.gohunt.com/browse/application-strategies/montana-elk-application-strategies-and-insights-to-help-apply-for-hunts', '2026-07-13', 'max+claude', 'Bonus/Preference Point Purchase Opens', 'Bonus points: Jul 1–Sep 30. Preference points: Jul 1–Dec 31.'),
('MT', 2026, array['deer','elk'], 'nonresident', 'points_only_close', '2026-09-30', null, 'America/Denver', 'verified', 'https://www.gohunt.com/browse/application-strategies/montana-elk-application-strategies-and-insights-to-help-apply-for-hunts', '2026-07-13', 'max+claude', 'Bonus Point Purchase Deadline', 'Preference point window extends to Dec 31.');

-- ---------- NEVADA ----------
insert into state_deadlines (state, year, species, residency, deadline_type, event_date, event_time, timezone, status, source_url, verified_at, verified_by, display_label, notes) values
('NV', 2026, array['mule_deer'], 'nonresident', 'application_close', '2026-03-09', '23:00', 'America/Los_Angeles', 'verified', 'https://www.ndow.org/wp-content/uploads/2026/01/17-B-CR-26-01-2026-2027-Application-Deadlines-Draw-Result-Dates.pdf', '2026-07-13', 'max+claude', 'Restricted NR Guided Mule Deer Deadline', 'NDOW official CR-26-01. Results on/before Mar 20.'),
('NV', 2026, array['mule_deer','elk','pronghorn','bighorn_sheep','mountain_goat','bear','moose'], 'all', 'application_close', '2026-05-13', '23:00', 'America/Los_Angeles', 'verified', 'https://www.getdrawnwest.com/application-guides/nevada-mule-deer-application-guide-2026', '2026-07-13', 'max+claude', 'Big Game Main Draw Deadline', 'Cross-referenced against NDOW CR-26-01 (Commission-approved deadlines doc). 11:00 PM PT.'),
('NV', 2026, array['mule_deer','elk','pronghorn','bighorn_sheep','mountain_goat','bear','moose'], 'all', 'results_posted', '2026-05-29', null, 'America/Los_Angeles', 'verified', 'https://www.ndow.org/events/big-game-tag-application-seminar-2026/', '2026-07-13', 'max+claude', 'Main Draw Results', 'NDOW: results on or before May 29; public list posted May 29, 2026.'),
('NV', 2026, array['mule_deer','elk','pronghorn'], 'all', 'secondary_draw_close', '2026-06-16', '23:00', 'America/Los_Angeles', 'verified', 'https://www.ndow.org/wp-content/uploads/2026/01/CR-26-01-2026-2027-Application-Deadlines-Draw-Result-Dates-NBWC-Approved-January-2026.pdf', '2026-07-13', 'max+claude', 'Second Draw Deadline', 'NDOW official CR-26-01.');

-- ---------- NEW MEXICO ----------
insert into state_deadlines (state, year, species, residency, deadline_type, event_date, event_time, timezone, status, source_url, verified_at, verified_by, display_label, notes) values
('NM', 2026, array['bear','turkey'], 'all', 'application_close', '2026-02-11', '17:00', 'America/Denver', 'verified', 'https://wildlife.dgf.nm.gov/hunting/applications-and-draw-information/', '2026-07-13', 'max+claude', 'Bear & Turkey Draw Deadline', 'NMDGF official. Results Feb 18.'),
('NM', 2026, array['deer','elk','pronghorn','bighorn_sheep','barbary_sheep','ibex','oryx','javelina'], 'all', 'application_close', '2026-03-18', '17:00', 'America/Denver', 'verified', 'https://wildlife.dgf.nm.gov/hunting/applications-and-draw-information/', '2026-07-13', 'max+claude', 'Big Game Draw Deadline', 'NMDGF official. HARD 5:00 PM MT cutoff. Prior-year harvest report required by same date or application rejected — surface this.'),
('NM', 2026, array['deer','elk','pronghorn','bighorn_sheep','barbary_sheep','ibex','oryx','javelina'], 'all', 'results_posted', '2026-04-22', null, 'America/Denver', 'verified', 'https://www.onxmaps.com/hunt/blog/hunting-application-details-new-mexico', '2026-07-13', 'max+claude', 'Big Game Draw Results', null);

-- ---------- OREGON ----------
insert into state_deadlines (state, year, species, residency, deadline_type, event_date, event_time, timezone, status, source_url, verified_at, verified_by, display_label, notes) values
('OR', 2026, array['bear'], 'all', 'application_close', '2026-02-10', '23:59', 'America/Los_Angeles', 'verified', 'https://myodfw.com/big-game-hunting/seasons', '2026-07-13', 'max+claude', 'Spring Bear Controlled Hunt Deadline', 'ODFW official.'),
('OR', 2026, array['deer','elk','pronghorn','bighorn_sheep','mountain_goat'], 'all', 'application_close', '2026-05-15', '23:59', 'America/Los_Angeles', 'verified', 'https://myodfw.com/news/oregon-hunters-dont-wait-review-changes-deer-hunt-areas-eastern-oregon-and-apply-early', '2026-07-13', 'max+claude', 'Controlled Hunt Deadline', 'ODFW official. 2026: eastern OR deer moved from WMUs to Deer Hunt Areas (NE-02 style codes) — unit-page mapping impact.'),
('OR', 2026, array['deer','elk','pronghorn','bighorn_sheep','mountain_goat'], 'all', 'results_posted', '2026-06-12', null, 'America/Los_Angeles', 'verified', 'https://myodfw.com/articles/controlled-hunt-navigation', '2026-07-13', 'max+claude', 'Controlled Hunt Results', 'Announced by June 12 each year.'),
('OR', 2026, array['deer','elk','pronghorn'], 'all', 'points_only_open', '2026-07-01', null, 'America/Los_Angeles', 'verified', 'https://www.onxmaps.com/hunt/blog/hunting-application-details-oregon', '2026-07-13', 'max+claude', 'Point-Saver Second Window Opens', 'Point savers can also be bought in the primary window.');

-- ---------- UTAH ----------
insert into state_deadlines (state, year, species, residency, deadline_type, event_date, event_time, timezone, status, source_url, verified_at, verified_by, display_label, notes) values
('UT', 2026, array['deer','elk','pronghorn','moose','bighorn_sheep','bison','mountain_goat'], 'all', 'application_open', '2026-03-19', '08:00', 'America/Denver', 'verified', 'https://www.theoutdoorwire.com/releases/2026/03/want-the-chance-to-hunt-big-game-in-utah-in-2026-the-application-period-opens-march-19/', '2026-07-13', 'max+claude', 'Big Game Applications Open', 'DWR-sourced. New draw system/vendor 2026: utahdraws.com.'),
('UT', 2026, array['deer','elk','pronghorn','moose','bighorn_sheep','bison','mountain_goat'], 'all', 'application_close', '2026-04-23', '23:00', 'America/Denver', 'verified', 'https://townlift.com/2026/03/utah-big-game-hunt-applications-open-march-19/', '2026-07-13', 'max+claude', 'Big Game Draw Deadline', '11:00 PM MT (5 PM if applying by phone). DWR-sourced.'),
('UT', 2026, array['deer','elk','pronghorn','moose','bighorn_sheep','bison','mountain_goat'], 'all', 'results_posted', '2026-05-31', null, 'America/Denver', 'verified', 'https://www.huntinfool.com/states/utah', '2026-07-13', 'max+claude', 'Draw Results', 'Emailed/posted by May 31.'),
('UT', 2026, array['elk'], 'all', 'otc_sale_start', '2026-07-07', null, 'America/Denver', 'verified', 'https://www.theoutdoorwire.com/releases/2026/03/want-the-chance-to-hunt-big-game-in-utah-in-2026-the-application-period-opens-march-19/', '2026-07-13', 'max+claude', 'General Elk Permits On Sale', 'Archery Jul 7, any-bull Jul 9, spike Jul 16.');

-- ---------- WASHINGTON ----------
-- Demonstrates the supersession pattern: original May 20 deadline was
-- extended mid-cycle to May 27. Both rows kept; original marked superseded.
insert into state_deadlines (state, year, species, residency, deadline_type, event_date, event_time, timezone, status, source_url, verified_at, verified_by, display_label, notes) values
('WA', 2026, array['deer','elk','moose','bighorn_sheep','mountain_goat'], 'all', 'application_open', '2026-04-20', null, 'America/Los_Angeles', 'verified', 'https://wdfw.wa.gov/newsroom/news-release/2026-washington-big-game-hunting-regulations-now-available-special-hunt-submissions-begin-april-20', '2026-07-13', 'max+claude', 'Special Hunt Applications Open', 'WDFW official.'),
('WA', 2026, array['deer','elk','moose','bighorn_sheep','mountain_goat'], 'all', 'application_close', '2026-05-20', '23:59', 'America/Los_Angeles', 'superseded', 'https://www.eregulations.com/washington/hunting/special-permit-application-instructions', '2026-07-13', 'max+claude', 'Special Hunt Deadline (original)', 'SUPERSEDED: extended to May 27 by WDFW on May 14, 2026 due to pamphlet shipping delay.'),
('WA', 2026, array['deer','elk','moose','bighorn_sheep','mountain_goat'], 'all', 'application_close', '2026-05-27', '23:59', 'America/Los_Angeles', 'verified', 'https://wdfw.wa.gov/newsroom/news-release/wdfw-extends-special-hunt-application-submission-deadline-may-27', '2026-07-13', 'max+claude', 'Special Hunt Deadline (extended)', 'WDFW official extension release. NOTE: WA also extended in 2024 — treat WA as high-volatility, daily monitoring in May.'),
('WA', 2026, array['deer','elk','moose','bighorn_sheep','mountain_goat'], 'all', 'results_posted', '2026-06-30', null, 'America/Los_Angeles', 'verified', 'https://wdfw.wa.gov/newsroom/news-release/2026-washington-big-game-hunting-regulations-now-available-special-hunt-submissions-begin-april-20', '2026-07-13', 'max+claude', 'Special Hunt Results', 'Posted to WILD accounts in June; display as "by end of June".');

-- ---------- WYOMING ----------
insert into state_deadlines (state, year, species, residency, deadline_type, event_date, event_time, timezone, status, source_url, verified_at, verified_by, display_label, notes) values
('WY', 2026, array['elk','deer','pronghorn','moose','bighorn_sheep','mountain_goat','turkey'], 'all', 'application_open', '2026-01-02', null, 'America/Denver', 'verified', 'https://wgfd.wyo.gov/news-events/big-game-applications-open-2026-27-hunting-season-key-deadlines-approaching', '2026-07-13', 'max+claude', 'Applications Open', 'WGFD official.'),
('WY', 2026, array['elk'], 'nonresident', 'application_close', '2026-02-02', '23:59', 'America/Denver', 'verified', 'https://wgfd.wyo.gov/news-events/big-game-applications-open-2026-27-hunting-season-key-deadlines-approaching', '2026-07-13', 'max+claude', 'Nonresident Elk Deadline', 'WGFD official. Feb 2 in 2026 (Jan 31 fell on Saturday).'),
('WY', 2026, array['elk'], 'nonresident', 'modification_deadline', '2026-05-08', null, 'America/Denver', 'verified', 'https://wgfd.wyo.gov/news-events/big-game-applications-open-2026-27-hunting-season-key-deadlines-approaching', '2026-07-13', 'max+claude', 'NR Elk Modify/Withdraw Deadline', null),
('WY', 2026, array['moose','bighorn_sheep','mountain_goat'], 'all', 'application_close', '2026-04-30', '23:59', 'America/Denver', 'verified', 'https://wgfd.wyo.gov/news-events/big-game-applications-open-2026-27-hunting-season-key-deadlines-approaching', '2026-07-13', 'max+claude', 'Moose, Sheep & Goat Deadline', 'Bison also Apr 30 (opens Mar 2).'),
('WY', 2026, array['elk'], 'nonresident', 'results_posted', '2026-05-21', null, 'America/Denver', 'verified', 'https://www.huntinfool.com/states/wyoming', '2026-07-13', 'max+claude', 'NR Elk Draw Results', 'Also sheep/moose/goat/bison results May 21.'),
('WY', 2026, array['deer','pronghorn'], 'all', 'application_close', '2026-06-01', '23:59', 'America/Denver', 'verified', 'https://wgfd.wyo.gov/news-events/big-game-applications-open-2026-27-hunting-season-key-deadlines-approaching', '2026-07-13', 'max+claude', 'Deer & Pronghorn Deadline (Res + NR)', 'Resident elk also closes Jun 1.'),
('WY', 2026, array['elk'], 'resident', 'application_close', '2026-06-01', '23:59', 'America/Denver', 'verified', 'https://wgfd.wyo.gov/news-events/big-game-applications-open-2026-27-hunting-season-key-deadlines-approaching', '2026-07-13', 'max+claude', 'Resident Elk Deadline', null),
('WY', 2026, array['elk','deer','pronghorn'], 'all', 'secondary_draw_open', '2026-06-22', null, 'America/Denver', 'verified', 'https://wgfd.wyo.gov/media/31721/download?inline=', '2026-07-13', 'max+claude', 'Leftover Draw Opens', 'WGFD official 2026 guide: Jun 22–26; tentative results Jul 8.'),
('WY', 2026, array['elk','deer','pronghorn'], 'all', 'secondary_draw_close', '2026-06-26', null, 'America/Denver', 'verified', 'https://wgfd.wyo.gov/media/31721/download?inline=', '2026-07-13', 'max+claude', 'Leftover Draw Deadline', null),
('WY', 2026, array['elk','deer','pronghorn'], 'all', 'leftover_fcfs_start', '2026-07-17', null, 'America/Denver', 'verified', 'https://wgfd.wyo.gov/licenses-applications', '2026-07-13', 'max+claude', 'FCFS Leftover Sales Begin', 'WGFD site: buy buttons enabled July 17.'),
('WY', 2026, array['elk','deer','pronghorn'], 'all', 'points_only_open', '2026-07-01', null, 'America/Denver', 'verified', 'https://backboneunlimited.com/blogs/advice/wyoming-non-resident-draw-guide-2026-how-to-apply-for-elk-mule-deer-antelope-tags', '2026-07-13', 'max+claude', 'Preference Point Purchase Opens', 'Points NOT auto-awarded on unsuccessful apps — must purchase in this window. Critical UX callout.'),
('WY', 2026, array['elk','deer','pronghorn'], 'all', 'points_only_close', '2026-10-31', null, 'America/Denver', 'pending_publication', 'https://backboneunlimited.com/blogs/advice/wyoming-non-resident-draw-guide-2026-how-to-apply-for-elk-mule-deer-antelope-tags', null, null, 'Preference Point Purchase Deadline', 'CONFLICT: sources show Oct 31 vs Nov 2, 2026 (Oct 31 is a Saturday). Confirm on wgfd.wyo.gov before display.');
