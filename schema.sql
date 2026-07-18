-- px.ar URL shortener schema
-- Run in the Supabase SQL editor for your project.

create table if not exists urls (
  code       text primary key,
  url        text not null,
  created_at timestamptz not null default now()
);

-- Speed up dedupe lookups by long URL.
create index if not exists urls_url_idx on urls (url);

-- Enable Row Level Security. Reads are public (anon key) so the
-- redirect route can resolve codes. Writes are only allowed via the
-- service role key (which bypasses RLS); no insert/update/delete
-- policies are created for anon.
alter table urls enable row level security;

-- Replace if re-running; safe no-op if it already exists.
drop policy if exists "public read urls" on urls;
create policy "public read urls" on urls
  for select using (true);
