-- Every table is owned by one user (RLS) and carries `updated_at` (server-stamped)
-- and a soft-delete flag so the offline-first client can sync incrementally.

create or replace function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at := clock_timestamp();
  return new;
end $$;

create table public.exercises (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  slug text,
  name_pt text not null,
  name_en text,
  muscle text,
  description text,
  tips jsonb not null default '[]',
  images jsonb not null default '[]',
  video_id text,
  video_title text,
  is_custom boolean not null default false,
  updated_at timestamptz not null default clock_timestamp(),
  deleted boolean not null default false
);

create table public.routines (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  short text,
  position int not null default 0,
  updated_at timestamptz not null default clock_timestamp(),
  deleted boolean not null default false
);

create table public.routine_items (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  routine_id uuid not null,
  position int not null default 0,
  exercise_ids jsonb not null default '[]',
  sets int not null default 3,
  sets_optional int not null default 0,
  reps_min int,
  reps_max int,
  reps_note text,
  rest_sec int not null default 90,
  per_side boolean not null default false,
  notes text,
  updated_at timestamptz not null default clock_timestamp(),
  deleted boolean not null default false
);

create table public.cycles (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  started_at timestamptz not null,
  ended_at timestamptz,
  target int not null default 50,
  notes text,
  updated_at timestamptz not null default clock_timestamp(),
  deleted boolean not null default false
);

create table public.sessions (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  cycle_id uuid,
  routine_id uuid,
  routine_name text,
  started_at timestamptz not null,
  finished_at timestamptz,
  updated_at timestamptz not null default clock_timestamp(),
  deleted boolean not null default false
);

create table public.session_sets (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  session_id uuid not null,
  item_id uuid,
  exercise_id uuid,
  exercise_name text,
  set_index int not null,
  weight_kg numeric,
  reps int,
  done_at timestamptz,
  updated_at timestamptz not null default clock_timestamp(),
  deleted boolean not null default false
);

create table public.settings (
  id uuid primary key,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  unit text not null default 'kg',
  updated_at timestamptz not null default clock_timestamp(),
  deleted boolean not null default false
);

do $$
declare t text;
begin
  foreach t in array array['exercises','routines','routine_items','cycles','sessions','session_sets','settings'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own rows" on public.%I for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format('create trigger touch before insert or update on public.%I for each row execute function public.touch_updated_at()', t);
    execute format('create index %I on public.%I (user_id, updated_at)', t || '_user_updated_idx', t);
  end loop;
end $$;
