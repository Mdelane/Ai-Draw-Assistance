-- Add photos array to listings table
-- Run in Supabase SQL Editor

alter table public.listings add column if not exists photos text[] default '{}';
