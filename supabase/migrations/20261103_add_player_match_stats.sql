create table if not exists public.player_match_stats (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references public.schools(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  goals integer not null default 0 check (goals >= 0),
  fair_play_points integer not null default 0 check (fair_play_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(match_id, player_id)
);

alter table public.player_match_stats enable row level security;

create index if not exists player_match_stats_school_idx on public.player_match_stats(school_id);
create index if not exists player_match_stats_match_idx on public.player_match_stats(match_id);
create index if not exists player_match_stats_player_idx on public.player_match_stats(player_id);

drop policy if exists "public_view_first_school_player_stats" on public.player_match_stats;
create policy "public_view_first_school_player_stats"
on public.player_match_stats
for select to anon
using (school_id = (select id from public.schools order by created_at asc limit 1));

drop policy if exists "staff_manage_player_match_stats" on public.player_match_stats;
create policy "staff_manage_player_match_stats"
on public.player_match_stats
for all to authenticated
using (private.is_staff() and school_id = private.current_school_id())
with check (private.is_staff() and school_id = private.current_school_id());

drop policy if exists "public_view_first_school_players" on public.players;
create policy "public_view_first_school_players"
on public.players
for select to anon
using (school_id = (select id from public.schools order by created_at asc limit 1));

drop policy if exists "public_view_first_school_classes" on public.classes;
create policy "public_view_first_school_classes"
on public.classes
for select to anon
using (school_id = (select id from public.schools order by created_at asc limit 1));
