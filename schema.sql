-- px.ar URL shortener schema
-- Run in the Supabase SQL editor for your project.

create table if not exists urls (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  url        text not null,
  owner_id   uuid references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

-- Speed up redirect lookups by code.
create index if not exists urls_code_idx on urls (code);

-- Speed up dedupe lookups by long URL.
create index if not exists urls_url_idx on urls (url);

-- Speed up owner lookups for the dashboard.
create index if not exists urls_owner_id_idx on urls (owner_id);

-- Speed up expiration cleanup.
create index if not exists urls_expires_at_idx on urls (expires_at);

-- Enable Row Level Security. Reads are public (anon key) so the
-- redirect route can resolve codes. Writes are only allowed via the
-- service role key (which bypasses RLS); no insert/update/delete
-- policies are created for anon.
alter table urls enable row level security;

-- Replace if re-running; safe no-op if it already exists.
drop policy if exists "public read urls" on urls;
create policy "public read urls" on urls
  for select using (true);

-- Authenticated users can insert their own entries.
drop policy if exists "owners insert urls" on urls;
create policy "owners insert urls" on urls
  for insert with check (auth.uid() = owner_id);

-- Authenticated users can read their own entries.
drop policy if exists "owners read urls" on urls;
create policy "owners read urls" on urls
  for select using (auth.uid() = owner_id);

-- Authenticated users can delete their own entries.
drop policy if exists "owners delete urls" on urls;
create policy "owners delete urls" on urls
  for delete using (auth.uid() = owner_id);
