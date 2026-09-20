-- ============================================================================
-- Digital Heroes — Database Schema (Supabase / Postgres)
-- ============================================================================
-- Run this in the Supabase SQL editor of a NEW project.
-- Assumes Supabase Auth is used for authentication (auth.users).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- PROFILES  (1:1 with auth.users; adds role + subscription + charity fields)
-- ---------------------------------------------------------------------------
create type user_role as enum ('subscriber', 'admin');
create type subscription_plan as enum ('monthly', 'yearly');
create type subscription_status as enum ('inactive', 'active', 'lapsed', 'cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role user_role not null default 'subscriber',

  -- Subscription
  subscription_plan subscription_plan,
  subscription_status subscription_status not null default 'inactive',
  subscription_renews_at timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,

  -- Charity selection
  charity_id uuid,
  charity_contribution_pct numeric(5,2) not null default 10.00
    check (charity_contribution_pct >= 10.00 and charity_contribution_pct <= 100.00),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- CHARITIES
-- ---------------------------------------------------------------------------
create table public.charities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null default '',
  image_url text,
  is_featured boolean not null default false,
  events jsonb not null default '[]'::jsonb, -- [{title, date, description}]
  created_at timestamptz not null default now()
);

alter table public.profiles
  add constraint profiles_charity_fk foreign key (charity_id) references public.charities(id);

-- ---------------------------------------------------------------------------
-- SCORES  (rolling window of 5 per user, enforced in application layer
-- via api/scores route; DB just stores them with a uniqueness guard)
-- ---------------------------------------------------------------------------
create table public.scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  score int not null check (score >= 1 and score <= 45),
  played_on date not null,
  created_at timestamptz not null default now(),
  unique (user_id, played_on) -- one score entry per date
);

create index scores_user_idx on public.scores(user_id, played_on desc);

-- ---------------------------------------------------------------------------
-- DRAWS  (monthly draw configuration + published results)
-- ---------------------------------------------------------------------------
create type draw_status as enum ('draft', 'simulated', 'published');
create type draw_mode as enum ('random', 'algorithmic');

create table public.draws (
  id uuid primary key default gen_random_uuid(),
  period text not null unique, -- e.g. '2026-09'
  mode draw_mode not null default 'random',
  status draw_status not null default 'draft',

  winning_numbers int[] not null default '{}', -- 5 numbers, 1-45
  active_subscriber_count int not null default 0,

  pool_total numeric(12,2) not null default 0,
  pool_5 numeric(12,2) not null default 0, -- 40% (rolls over if unclaimed)
  pool_4 numeric(12,2) not null default 0, -- 35%
  pool_3 numeric(12,2) not null default 0, -- 25%

  jackpot_rollover_from uuid references public.draws(id),

  simulated_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- DRAW ENTRIES  (each subscriber's numbers for a given draw period)
-- ---------------------------------------------------------------------------
create table public.draw_entries (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  numbers int[] not null, -- 5 numbers derived from the user's last 5 scores
  match_count int, -- computed at publish time
  created_at timestamptz not null default now(),
  unique (draw_id, user_id)
);

-- ---------------------------------------------------------------------------
-- WINNERS  (verification + payout workflow)
-- ---------------------------------------------------------------------------
create type winner_payment_status as enum ('pending', 'paid');
create type winner_review_status as enum ('awaiting_proof', 'submitted', 'approved', 'rejected');

create table public.winners (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.draws(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  match_tier int not null check (match_tier in (3,4,5)),
  amount numeric(12,2) not null default 0,

  review_status winner_review_status not null default 'awaiting_proof',
  proof_url text,
  admin_note text,

  payment_status winner_payment_status not null default 'pending',
  paid_at timestamptz,

  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- DONATIONS  (independent, not tied to gameplay/subscription)
-- ---------------------------------------------------------------------------
create table public.donations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  charity_id uuid not null references public.charities(id),
  amount numeric(12,2) not null check (amount > 0),
  stripe_payment_intent_id text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
alter table public.profiles enable row level security;
alter table public.charities enable row level security;
alter table public.scores enable row level security;
alter table public.draws enable row level security;
alter table public.draw_entries enable row level security;
alter table public.winners enable row level security;
alter table public.donations enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql stable
security definer
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- Profiles: users read/update their own row; admins read/update all
create policy "profiles_self_select" on public.profiles for select using (auth.uid() = id or public.is_admin());
create policy "profiles_self_update" on public.profiles for update using (auth.uid() = id or public.is_admin());
create policy "profiles_admin_insert" on public.profiles for insert with check (auth.uid() = id or public.is_admin());

-- Charities: public read; admin write
create policy "charities_public_select" on public.charities for select using (true);
create policy "charities_admin_write" on public.charities for insert with check (public.is_admin());
create policy "charities_admin_update" on public.charities for update using (public.is_admin());
create policy "charities_admin_delete" on public.charities for delete using (public.is_admin());

-- Scores: owner + admin only
create policy "scores_owner_select" on public.scores for select using (auth.uid() = user_id or public.is_admin());
create policy "scores_owner_insert" on public.scores for insert with check (auth.uid() = user_id or public.is_admin());
create policy "scores_owner_update" on public.scores for update using (auth.uid() = user_id or public.is_admin());
create policy "scores_owner_delete" on public.scores for delete using (auth.uid() = user_id or public.is_admin());

-- Draws: public read of published draws; admin full access
create policy "draws_public_select" on public.draws for select using (status = 'published' or public.is_admin());
create policy "draws_admin_write" on public.draws for insert with check (public.is_admin());
create policy "draws_admin_update" on public.draws for update using (public.is_admin());

-- Draw entries: owner + admin
create policy "entries_owner_select" on public.draw_entries for select using (auth.uid() = user_id or public.is_admin());
create policy "entries_admin_write" on public.draw_entries for insert with check (public.is_admin() or auth.uid() = user_id);

-- Winners: owner + admin
create policy "winners_owner_select" on public.winners for select using (auth.uid() = user_id or public.is_admin());
create policy "winners_owner_update" on public.winners for update using (auth.uid() = user_id or public.is_admin());
create policy "winners_admin_insert" on public.winners for insert with check (public.is_admin());

-- Donations: owner + admin
create policy "donations_owner_select" on public.donations for select using (auth.uid() = user_id or public.is_admin());
create policy "donations_insert" on public.donations for insert with check (auth.uid() = user_id or user_id is null);

-- ============================================================================
-- SEED DATA (sample charities so the directory isn't empty)
-- ============================================================================
insert into public.charities (name, slug, description, is_featured, events) values
('Bright Futures Foundation', 'bright-futures-foundation', 'Supports education access for underserved children across urban India.', true,
  '[{"title":"Annual Charity Golf Day","date":"2026-11-14","description":"A fundraising golf day at DLF Golf Course."}]'),
('Clean Rivers Initiative', 'clean-rivers-initiative', 'River cleanup and water conservation projects across northern India.', false, '[]'),
('Care for Strays', 'care-for-strays', 'Rescue, shelter, and rehoming for stray animals in urban neighbourhoods.', false, '[]');

-- Auto-create a profile row whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
