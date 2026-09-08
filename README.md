# Vinylbox

Vinylbox is basically Letterboxd for music. Log the albums you listen to, rate them (whole album or track by track), write reviews, keep a "to listen" list, and see what other people are into.

It's a **v1 test build** — I put this together to try out the idea, not a finished product. Some things are still rough around the edges (see [Known limitations](#known-limitations) below).

Built with **Next.js 16** (App Router, Server Actions) and **Supabase** (Postgres + Auth + Row Level Security).

## What's in it

- Email/password sign-up and login
- Homepage with a few rows: albums released this month, the most-listened albums on the site, a few random picks you haven't logged yet, and recent reviews from other users. Each row has a "see all" link to a full page.
- Album pages: average rating, reviews, and you can rate individual tracks too
- A listening diary — every time you log an album it's timestamped, and you can log the same album more than once
- A "want to listen" list
- Public profile pages, with links to playlists you've made on Spotify/Deezer/Apple Music — either paste the link yourself, or connect your Spotify account and it'll pull your playlists in automatically (see [Connecting Spotify](#connecting-spotify-optional))
- Artist pages listing their discography
- Filtering and sorting on the full album catalog: by genre, by year, or by popularity

## Setting it up

### 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project — the free tier is plenty for this.
2. Under **Project Settings → API**, grab your **project URL** and **anon public key**.
3. Set up the database schema. There are two ways to do this — pick one, they end up in the same place:

   **Option A — SQL Editor (easiest)**

   Open the **SQL Editor** in your Supabase project, paste in the contents of [`supabase/schema.sql`](supabase/schema.sql), and run it.

   **Option B — Prisma**

   Only worth it if you plan on evolving the schema later with `prisma db push`. Prisma is only used here to manage tables — the app itself still reads and writes through the Supabase client so that Row Level Security actually applies (more on this under [A note on Prisma](#a-note-on-prisma)).

   ```bash
   cp prisma/.env.example prisma/.env   # fill in DATABASE_URL
   npm run db:push                      # creates the tables from prisma/schema.prisma
   npm run db:seed                      # RLS policies, triggers, demo data
   ```

   Heads up: `db push` only works on a **blank** database. Once the schema's been applied once — either way — don't run `db push` again on that same project. `profiles.id` points at `auth.users`, a schema Prisma doesn't know about, and `db push` will refuse to proceed unless you tell it to manage the `auth` schema too. Don't do that — it'll try to manage (and potentially wipe) Supabase's own internal auth tables.

   Both options produce the exact same schema: the tables, the RLS policies (catalog and ratings are publicly readable, writes are locked to the owner), a trigger that creates a profile automatically on sign-up, and a handful of demo artists/albums so the app isn't empty on first run.

4. Optional, but handy for testing: under **Authentication → Providers → Email**, turn off "Confirm email" so you can log in right after signing up without checking your inbox.

### 2. Configure the app

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with the URL and anon key from step 1.

### 3. Run it

```bash
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

## Connecting Spotify (optional)

This lets a user link their Spotify account from their profile page so their playlists get imported automatically, instead of pasting each link by hand. Nothing else in the app depends on it — skip this section if you don't care about it.

1. Create an app on the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard).
2. In the app's settings, add a **Redirect URI**. For local dev, use `http://127.0.0.1:3000/api/spotify/callback` — you'll need the production URL there too once you deploy, and Spotify's fine with having more than one registered.
3. Grab the **Client ID** and **Client Secret** and drop them into `.env.local`:
   ```
   SPOTIFY_CLIENT_ID=...
   SPOTIFY_CLIENT_SECRET=...
   ```
4. While the Spotify app is in **Development Mode** (the default), only accounts you've explicitly added under "User Management" in the dashboard can actually log in through it — up to 5 accounts. You'd need to request Spotify's review to go live for everyone else.

Two things that tripped me up and might trip you up too:
- Spotify only allows plain `http://` for the loopback address `127.0.0.1` — not for `localhost`, even though they both mean the same thing on your machine. Register `127.0.0.1` and actually browse the app at `http://127.0.0.1:3000`, not `localhost:3000`, or the redirect URI won't match and Spotify will reject it.
- The access we ask for is read-only (`playlist-read-private` and `playlist-read-collaborative` scopes) — nothing that lets the app touch your Spotify account. The tokens are stored in a `spotify_connections` table that isn't publicly readable — only the account owner (via RLS) can see their own.

## Adding albums to the catalog

Right now the catalog (artists/albums/tracks) is managed directly through **Supabase → Table Editor**, or plain SQL. Those tables are readable by anyone but not writable from the app itself — that's on purpose for a test build; a proper "add an album" UI can come later.

`cover_url` just takes any public image URL, nothing fancier — the app renders it as a plain `<img>`.

### Bulk-importing from iTunes and MusicBrainz

[`scripts/import-itunes.mjs`](scripts/import-itunes.mjs) fills the catalog from Apple's iTunes Search API (public, no key needed) for a list of artists defined in [`scripts/artists-list.mjs`](scripts/artists-list.mjs). It talks to Postgres directly over `DATABASE_URL` (so, like Prisma, it bypasses RLS) to write into `artists`/`albums`/`tracks`.

```bash
npm run import:itunes                  # every artist on the list
IMPORT_LIMIT=3 npm run import:itunes   # just the first 3, useful for a test run
```

It's safe to re-run — artists and albums are looked up by name before inserting, so nothing gets duplicated. Edit the `ARTISTS` list in the script to change what gets imported.

[`scripts/import-year-end-charts.mjs`](scripts/import-year-end-charts.mjs) imports the top 20 albums for each year from 2016–2025, based on the official year-end charts from the **Official UK Charts Company** — there's no free API for historical chart data, so it's hardcoded in [`scripts/year-end-charts-data.mjs`](scripts/year-end-charts-data.mjs). Each entry gets looked up on iTunes in two passes (artist-scoped search first, then title matching) to avoid attaching a generic album title to the wrong artist. When it's not confident about a match, it skips the entry rather than guessing (shown with a `?` in the logs).

```bash
npm run import:charts                   # all 10 years
YEARS=2023,2024 npm run import:charts   # just a couple, for testing
```

[`scripts/import-musicbrainz.mjs`](scripts/import-musicbrainz.mjs) imports studio albums (with full tracklists) for the same artist list, but from **MusicBrainz** instead of the iTunes Store — its catalog is more complete and more open (some well-known albums, like Charli xcx's *Brat*, simply don't turn up in iTunes' search index at all). Cover art comes from the Cover Art Archive. Run it alongside `import-itunes.mjs`, not instead of it — the two dedupe cleanly against each other.

```bash
npm run import:musicbrainz                            # every artist on the list
IMPORT_LIMIT=3 npm run import:musicbrainz              # just the first 3
ONLY="Kanye West,Phoenix" npm run import:musicbrainz   # specific artists, handy for fixing one bad case
```

MusicBrainz is crowd-sourced, so the data isn't always spotless. The script already filters out the obvious junk (live albums, compilations, remixes, anything with no release date), but every now and then a search still turns up a tribute band or a same-named artist instead of the real one — you'll see it as an unexpected artist name in the logs (`+ Unexpected Name — Title`); re-run just that one with `ONLY=`.

The API is rate-limited to roughly one request per second, and the connection to `musicbrainz.org` was occasionally flaky in testing — the script retries automatically, but a full run can still take 15–25 minutes.

## Project layout

```
src/
  app/
    albums/[id]/          album page + server actions (rate, log a listen, watchlist)
    albums/mois/           this month's releases
    albums/populaires/     top 100 most-listened albums
    artists/[id]/          artist page
    diary/                 the logged-in user's listening diary
    watchlist/              "want to listen" list
    profile/[username]/     public profile + playlist links
    api/spotify/            Spotify OAuth connect/callback routes
    login/ signup/          auth pages
  components/              shared UI (star ratings, album cards, the horizontal scroll rows, playlist form...)
  lib/
    supabase/               Supabase clients (browser / server / proxy) + hand-written types
    spotify.ts              Spotify token refresh helper
    request-origin.ts       works around a Next.js dev quirk, see below
    actions/auth.ts         auth server actions
    format.ts                formatting helpers
  proxy.ts                  refreshes the Supabase session on every request (this is middleware.ts, renamed in Next 16)
supabase/
  schema.sql                full schema + RLS + demo data (setup option A)
prisma/
  schema.prisma              tables only, in Prisma (setup option B)
  rls-and-seed.sql           RLS + triggers + demo data for option B (everything Prisma can't express)
scripts/
  import-itunes.mjs          bulk import from the iTunes API
  import-musicbrainz.mjs     bulk import from MusicBrainz
  import-year-end-charts.mjs bulk import from UK year-end charts
```

## A note on Prisma

Prisma only manages the *schema* here, not runtime data access. Prisma Client connects to Postgres directly as the `postgres` user, which bypasses Row Level Security entirely — so the app itself always talks to Postgres through `@supabase/supabase-js` with the `anon` key instead, keeping RLS as the actual authorization boundary. If you change `prisma/schema.prisma`, remember to update [`src/lib/supabase/types.ts`](src/lib/supabase/types.ts) by hand too (it's written in the same shape `npx supabase gen types typescript` would produce).

## Known limitations

- **"Popularity" is really just our own users' ratings.** There's no streaming data available from either iTunes or MusicBrainz, so "most popular" on this site means highest rating count + average rating among Vinylbox users — not actual listen counts anywhere else. A brand new catalog with no ratings yet will just sort everything as a tie.
- **Genre is only filled in for albums imported after that column existed.** It's populated by `import-itunes.mjs` and `import-musicbrainz.mjs`; anything added before that got no genre and just shows up under "all genres".
- **The catalog list pages paginate manually rather than fetching everything at once** — Supabase's PostgREST layer caps any single response at 1,000 rows, so past that point a naive "fetch it all" query would silently drop data. Worth knowing if you extend those pages.
