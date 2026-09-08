-- AlbumReviewers — Supabase schema (v1 / test version)
-- Run this whole file once in the Supabase SQL Editor (Project -> SQL Editor -> New query).
-- Safe to re-run: everything is guarded with IF NOT EXISTS / OR REPLACE / DROP POLICY IF EXISTS.
--
-- This is the all-in-one path (README "Option A"). Prefer Prisma instead
-- (README "Option B")? Use prisma/schema.prisma + prisma/rls-and-seed.sql,
-- which produce the exact same schema — don't run both against the same DB.

create extension if not exists "pgcrypto";

-- =========================================================
-- TABLES
-- =========================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  display_name text,
  avatar_url text,
  bio text,
  created_at timestamptz not null default now()
);

create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  image_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.albums (
  id uuid primary key default gen_random_uuid(),
  artist_id uuid not null references public.artists (id) on delete cascade,
  title text not null,
  cover_url text,
  release_date date,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.tracks (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums (id) on delete cascade,
  track_number int not null,
  title text not null,
  duration_seconds int,
  unique (album_id, track_number)
);

-- One rating/review per user per album (edit-in-place, mirrors a Letterboxd film rating).
create table if not exists public.album_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  album_id uuid not null references public.albums (id) on delete cascade,
  rating numeric(2, 1) check (rating >= 0.5 and rating <= 5 and rating * 2 = round(rating * 2)),
  review text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, album_id)
);

-- One rating per user per track.
create table if not exists public.track_ratings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  track_id uuid not null references public.tracks (id) on delete cascade,
  rating numeric(2, 1) not null check (rating >= 0.5 and rating <= 5 and rating * 2 = round(rating * 2)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, track_id)
);

-- Diary: every time a user logs a listen (can log the same album more than once).
create table if not exists public.listens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  album_id uuid not null references public.albums (id) on delete cascade,
  listened_at date not null default current_date,
  created_at timestamptz not null default now()
);

-- Backlog / "want to listen" list.
create table if not exists public.watchlist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  album_id uuid not null references public.albums (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, album_id)
);

create index if not exists albums_artist_id_idx on public.albums (artist_id);
create index if not exists albums_created_at_idx on public.albums (created_at desc);
create index if not exists tracks_album_id_idx on public.tracks (album_id);
create index if not exists album_ratings_album_id_idx on public.album_ratings (album_id);
create index if not exists album_ratings_user_id_idx on public.album_ratings (user_id);
create index if not exists track_ratings_track_id_idx on public.track_ratings (track_id);
create index if not exists listens_user_id_idx on public.listens (user_id, listened_at desc);
create index if not exists listens_album_id_idx on public.listens (album_id);
create index if not exists watchlist_user_id_idx on public.watchlist (user_id);

-- =========================================================
-- updated_at trigger helper
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.album_ratings;
create trigger set_updated_at
  before update on public.album_ratings
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.track_ratings;
create trigger set_updated_at
  before update on public.track_ratings
  for each row execute function public.set_updated_at();

-- =========================================================
-- Auto-create a profile row whenever someone signs up
-- =========================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'username',
      'user_' || substr(new.id::text, 1, 8)
    ),
    coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.profiles enable row level security;
alter table public.artists enable row level security;
alter table public.albums enable row level security;
alter table public.tracks enable row level security;
alter table public.album_ratings enable row level security;
alter table public.track_ratings enable row level security;
alter table public.listens enable row level security;
alter table public.watchlist enable row level security;

-- Profiles: public read, owner write
drop policy if exists "profiles are viewable by everyone" on public.profiles;
create policy "profiles are viewable by everyone" on public.profiles
  for select using (true);

drop policy if exists "users can update their own profile" on public.profiles;
create policy "users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

drop policy if exists "users can insert their own profile" on public.profiles;
create policy "users can insert their own profile" on public.profiles
  for insert with check (auth.uid() = id);

-- Catalog data (artists/albums/tracks): public read.
-- Writes are left to the Supabase dashboard / service role while curating the catalog by hand.
drop policy if exists "artists are viewable by everyone" on public.artists;
create policy "artists are viewable by everyone" on public.artists
  for select using (true);

drop policy if exists "albums are viewable by everyone" on public.albums;
create policy "albums are viewable by everyone" on public.albums
  for select using (true);

drop policy if exists "tracks are viewable by everyone" on public.tracks;
create policy "tracks are viewable by everyone" on public.tracks
  for select using (true);

-- Album ratings/reviews: public read, owner write
drop policy if exists "album ratings are viewable by everyone" on public.album_ratings;
create policy "album ratings are viewable by everyone" on public.album_ratings
  for select using (true);

drop policy if exists "users manage their own album ratings" on public.album_ratings;
create policy "users manage their own album ratings" on public.album_ratings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Track ratings: public read, owner write
drop policy if exists "track ratings are viewable by everyone" on public.track_ratings;
create policy "track ratings are viewable by everyone" on public.track_ratings
  for select using (true);

drop policy if exists "users manage their own track ratings" on public.track_ratings;
create policy "users manage their own track ratings" on public.track_ratings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Listens (diary): public read, owner write
drop policy if exists "listens are viewable by everyone" on public.listens;
create policy "listens are viewable by everyone" on public.listens
  for select using (true);

drop policy if exists "users manage their own listens" on public.listens;
create policy "users manage their own listens" on public.listens
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Watchlist: public read, owner write
drop policy if exists "watchlists are viewable by everyone" on public.watchlist;
create policy "watchlists are viewable by everyone" on public.watchlist
  for select using (true);

drop policy if exists "users manage their own watchlist" on public.watchlist;
create policy "users manage their own watchlist" on public.watchlist
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- =========================================================
-- SEED DATA (sample catalog so the app isn't empty on first run)
-- =========================================================

do $$
declare
  radiohead uuid;
  daft_punk uuid;
  kendrick uuid;
  fka uuid;
  album1 uuid;
  album2 uuid;
  album3 uuid;
  album4 uuid;
begin
  if exists (select 1 from public.artists limit 1) then
    return;
  end if;

  insert into public.artists (name, image_url) values ('Radiohead', null)
    returning id into radiohead;
  insert into public.artists (name, image_url) values ('Daft Punk', null)
    returning id into daft_punk;
  insert into public.artists (name, image_url) values ('Kendrick Lamar', null)
    returning id into kendrick;
  insert into public.artists (name, image_url) values ('FKA twigs', null)
    returning id into fka;

  insert into public.albums (artist_id, title, cover_url, release_date, description)
    values (radiohead, 'In Rainbows', null, '2007-10-10', 'Le septième album studio de Radiohead, sorti en téléchargement à prix libre.')
    returning id into album1;
  insert into public.tracks (album_id, track_number, title, duration_seconds) values
    (album1, 1, '15 Step', 237),
    (album1, 2, 'Bodysnatchers', 244),
    (album1, 3, 'Nude', 255),
    (album1, 4, 'Weird Fishes/Arpeggi', 318),
    (album1, 5, 'All I Need', 229),
    (album1, 6, 'Faust Arp', 129),
    (album1, 7, 'Reckoner', 290),
    (album1, 8, 'House of Cards', 328),
    (album1, 9, 'Jigsaw Falling into Place', 244),
    (album1, 10, 'Videotape', 281);

  insert into public.albums (artist_id, title, cover_url, release_date, description)
    values (daft_punk, 'Random Access Memories', null, '2013-05-17', 'Album hommage à la musique disco et funk des années 70-80.')
    returning id into album2;
  insert into public.tracks (album_id, track_number, title, duration_seconds) values
    (album2, 1, 'Give Life Back to Music', 274),
    (album2, 2, 'The Game of Love', 321),
    (album2, 3, 'Giorgio by Moroder', 544),
    (album2, 4, 'Within', 228),
    (album2, 5, 'Instant Crush', 337),
    (album2, 6, 'Lose Yourself to Dance', 353),
    (album2, 7, 'Touch', 497),
    (album2, 8, 'Get Lucky', 369),
    (album2, 9, 'Beyond', 285),
    (album2, 10, 'Motherboard', 337),
    (album2, 11, 'Fragments of Time', 279),
    (album2, 12, 'Doin'' it Right', 253),
    (album2, 13, 'Contact', 388);

  insert into public.albums (artist_id, title, cover_url, release_date, description)
    values (kendrick, 'To Pimp a Butterfly', null, '2015-03-15', 'Troisième album studio de Kendrick Lamar, mélange de jazz, funk et hip-hop.')
    returning id into album3;
  insert into public.tracks (album_id, track_number, title, duration_seconds) values
    (album3, 1, 'Wesley''s Theory', 287),
    (album3, 2, 'For Free? (Interlude)', 130),
    (album3, 3, 'King Kunta', 234),
    (album3, 4, 'Institutionalized', 271),
    (album3, 5, 'These Walls', 320),
    (album3, 6, 'Alright', 219),
    (album3, 7, 'For Sale? (Interlude)', 288),
    (album3, 8, 'Momma', 249),
    (album3, 9, 'Hood Politics', 291);

  insert into public.albums (artist_id, title, cover_url, release_date, description)
    values (fka, 'Magdalene', null, '2019-11-08', 'Deuxième album studio de FKA twigs.')
    returning id into album4;
  insert into public.tracks (album_id, track_number, title, duration_seconds) values
    (album4, 1, 'thousand eyes', 253),
    (album4, 2, 'home with you', 328),
    (album4, 3, 'sad day', 253),
    (album4, 4, 'holy terrain', 253),
    (album4, 5, 'mary magdalene', 218),
    (album4, 6, 'fallen alien', 227),
    (album4, 7, 'mirrored heart', 216),
    (album4, 8, 'daybed', 226),
    (album4, 9, 'cellophane', 300);
end $$;
