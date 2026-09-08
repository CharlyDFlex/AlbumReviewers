#!/usr/bin/env node
// Bulk-imports albums (+ tracklists) from the iTunes Search API for a
// curated list of artists, into the artists/albums/tracks tables.
//
// Connects directly to Postgres (DATABASE_URL, same as Prisma) instead of
// going through the Supabase client, because the anon key's RLS policies
// don't allow writes to the catalog tables from the app — see
// supabase/schema.sql. Safe to re-run: artists/albums/tracks are matched
// by name before inserting, so nothing gets duplicated.
//
// Usage: npm run import:itunes

import { Client } from "pg";
import { readFileSync, existsSync } from "node:fs";
import { ARTISTS } from "./artists-list.mjs";

const ALBUMS_PER_ARTIST = 10;
const REQUEST_DELAY_MS = 700;
const MIN_TRACK_COUNT = 4;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function loadDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  const envPath = "prisma/.env";
  if (existsSync(envPath)) {
    const line = readFileSync(envPath, "utf8")
      .split("\n")
      .find((l) => l.trim().startsWith("DATABASE_URL="));
    if (line) {
      return line
        .slice(line.indexOf("=") + 1)
        .trim()
        .replace(/^"|"$/g, "");
    }
  }
  throw new Error(
    "DATABASE_URL introuvable. Renseigne-le dans prisma/.env (voir prisma/.env.example) ou en variable d'environnement.",
  );
}

async function fetchJson(url, attempt = 1) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Vinylbox-Import/1.0 (test project)" },
  });
  if (res.status === 403 || res.status === 429) {
    if (attempt > 3) throw new Error(`Limité par l'API après ${attempt} essais : ${url}`);
    const wait = 15000 * attempt;
    console.warn(`  (limité par l'API, pause ${wait / 1000}s...)`);
    await sleep(wait);
    return fetchJson(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);
  return res.json();
}

function upgradeArtwork(url) {
  if (!url) return null;
  return url.replace(/\d+x\d+bb\.(jpg|png)$/, "1200x1200bb.$1");
}

function secondsFromMillis(ms) {
  return typeof ms === "number" ? Math.round(ms / 1000) : null;
}

async function findOrCreateArtist(client, name) {
  const existing = await client.query(
    "select id from public.artists where lower(name) = lower($1)",
    [name],
  );
  if (existing.rows.length > 0) return existing.rows[0].id;
  const inserted = await client.query(
    "insert into public.artists (name) values ($1) returning id",
    [name],
  );
  return inserted.rows[0].id;
}

async function importAlbumTracks(client, albumId, collectionId) {
  const url = `https://itunes.apple.com/lookup?id=${collectionId}&entity=song`;
  const data = await fetchJson(url);
  await sleep(REQUEST_DELAY_MS);
  const tracks = (data.results ?? []).filter((r) => r.wrapperType === "track");
  for (const t of tracks) {
    await client.query(
      `insert into public.tracks (album_id, track_number, title, duration_seconds)
       values ($1, $2, $3, $4)
       on conflict (album_id, track_number) do nothing`,
      [albumId, t.trackNumber ?? 1, t.trackName ?? "Untitled", secondsFromMillis(t.trackTimeMillis)],
    );
  }
  return tracks.length;
}

async function importArtist(client, artistName, stats) {
  const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
    artistName,
  )}&entity=album&limit=${ALBUMS_PER_ARTIST}&media=music`;

  let results;
  try {
    const data = await fetchJson(searchUrl);
    results = (data.results ?? []).filter(
      (r) =>
        r.collectionType === "Album" &&
        r.trackCount >= MIN_TRACK_COUNT &&
        r.artistName &&
        r.collectionName,
    );
  } catch (err) {
    console.error(`  recherche échouée pour ${artistName}: ${err.message}`);
    return;
  }
  await sleep(REQUEST_DELAY_MS);

  if (results.length === 0) {
    console.log(`  aucun album trouvé pour ${artistName}`);
    return;
  }

  const canonicalName = results[0].artistName;
  const artistId = await findOrCreateArtist(client, canonicalName);

  const seenTitles = new Set();
  for (const r of results) {
    const title = r.collectionName.trim();
    const key = title.toLowerCase();
    if (seenTitles.has(key)) continue;
    seenTitles.add(key);

    const existing = await client.query(
      "select id from public.albums where artist_id = $1 and lower(title) = lower($2)",
      [artistId, title],
    );

    let albumId;
    if (existing.rows.length > 0) {
      albumId = existing.rows[0].id;
      stats.albumsSkipped++;
    } else {
      const releaseDate = r.releaseDate ? r.releaseDate.slice(0, 10) : null;
      const inserted = await client.query(
        `insert into public.albums (artist_id, title, cover_url, release_date)
         values ($1, $2, $3, $4) returning id`,
        [artistId, title, upgradeArtwork(r.artworkUrl100), releaseDate],
      );
      albumId = inserted.rows[0].id;
      stats.albumsInserted++;
      console.log(`  + ${canonicalName} — ${title}`);
    }

    try {
      const trackCount = await importAlbumTracks(client, albumId, r.collectionId);
      stats.tracksInserted += trackCount;
    } catch (err) {
      console.error(`    tracklist échouée pour "${title}": ${err.message}`);
    }
  }
}

async function main() {
  const client = new Client({
    connectionString: loadDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const stats = { albumsInserted: 0, albumsSkipped: 0, tracksInserted: 0 };
  const limit = Number(process.env.IMPORT_LIMIT) || ARTISTS.length;
  const artists = ARTISTS.slice(0, limit);

  for (const artist of artists) {
    console.log(`Import : ${artist}`);
    await importArtist(client, artist, stats);
  }

  await client.end();
  console.log("\nTerminé.");
  console.log(`  ${stats.albumsInserted} albums ajoutés, ${stats.albumsSkipped} déjà présents.`);
  console.log(`  ${stats.tracksInserted} morceaux ajoutés.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
