-- Sleep tracking table (added 2026-11-13 when the app switched to sleep-only).
-- Old `feedings` / `diapers` tables are left untouched as history.
create table if not exists public.sleeps (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('nap', 'night')),
  started_at timestamptz not null,
  ended_at timestamptz,            -- null = still asleep
  notes text,
  created_at timestamptz not null default now(),
  check (ended_at is null or ended_at > started_at)
);

create index if not exists sleeps_started_at_idx on public.sleeps (started_at desc);

-- Only one sleep can be "in progress" at a time
create unique index if not exists sleeps_one_active on public.sleeps ((true)) where ended_at is null;

-- Same open policy as the other tables (no auth in this app)
alter table public.sleeps enable row level security;
create policy "open access" on public.sleeps for all using (true) with check (true);
grant select, insert, update, delete on public.sleeps to anon, authenticated;
