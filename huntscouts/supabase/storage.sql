-- Run this in Supabase SQL Editor after the main schema.sql

-- Storage buckets
insert into storage.buckets (id, name, public)
values
  ('listing-photos', 'listing-photos', true),
  ('review-photos', 'review-photos', true)
on conflict (id) do nothing;

-- Listing photos: outfitters can upload to their own listings, anyone can read
create policy "Outfitters upload listing photos" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'listing-photos'
    and (storage.foldername(name))[1] = 'listings'
  );

create policy "Public read listing photos" on storage.objects
  for select using (bucket_id = 'listing-photos');

create policy "Outfitters delete own listing photos" on storage.objects
  for delete to authenticated
  using (bucket_id = 'listing-photos');

-- Review photos: hunters upload, anyone reads
create policy "Hunters upload review photos" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'review-photos');

create policy "Public read review photos" on storage.objects
  for select using (bucket_id = 'review-photos');
