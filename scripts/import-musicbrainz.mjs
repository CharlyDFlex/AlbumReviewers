#!/usr/bin/env node
// Bulk-imports albums (+ tracklists) from the MusicBrainz API for the
// shared curated artist list, into the artists/albums/tracks tables.
// Cover art comes from the Cover Art Archive (MusicBrainz's companion
// image service).
//
// MusicBrainz is a fuller, more accurate catalog than the iTunes Store —
// it has official studio albums the iTunes Search API doesn't index at
// all (e.g. Charli xcx's "Brat"), which is what motivated adding this as
// a second source alongside import-itunes.mjs rather than replacing it.
//
// Connects directly to Postgres (DATABASE_URL, same as Prisma) instead of
// going through the Supabase client, because the anon key's RLS policies
// don't allow writes to the catalog tables from the app — see
// supabase/schema.sql. Safe to re-run: artists/albums/tracks are matched
// by name before inserting, so nothing gets duplicated (also safe to run
// alongside import-itunes.mjs on the same database for that reason).
//
// MusicBrainz asks API clients to identify themselves and to stay near
// 1 request/second — see https://musicbrainz.org/doc/MusicBrainz_API/Rate_Limiting
// and https://musicbrainz.org/doc/MusicBrainz_API#Provide_meaningful_User-Agent_strings.
//
// Usage: npm run import:musicbrainz

import { Client } from "pg";
import { readFileSync, existsSync } from "node:fs";
import { ARTISTS } from "./artists-list.mjs";
import { normalizeGenre } from "./genre.mjs";

const MB_REQUEST_DELAY_MS = 1100;
const USER_AGENT = "Vinylbox-Import/1.0 ( test project, no public contact )";

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

async function mbFetch(url, attempt = 1) {
  let res;
  try {
    res = await fetch(url, { headers: { "User-Agent": USER_AGENT, Accept: "application/json" } });
  } catch (err) {
    // Network-level failure (DNS/TCP/TLS hiccup) — retry, this API host
    // has proven flaky in practice even when reachable in general.
    if (attempt > 4) throw new Error(`Échec réseau après ${attempt} essais sur ${url}: ${err.message}`);
    const wait = 3000 * attempt;
    console.warn(`  (échec réseau, pause ${wait / 1000}s puis nouvel essai...)`);
    await sleep(wait);
    return mbFetch(url, attempt + 1);
  }
  if (res.status === 503 || res.status === 429) {
    if (attempt > 4) throw new Error(`Limité par l'API après ${attempt} essais : ${url}`);
    const wait = 5000 * attempt;
    console.warn(`  (limité par l'API, pause ${wait / 1000}s...)`);
    await sleep(wait);
    return mbFetch(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status} pour ${url}`);
  const json = await res.json();
  await sleep(MB_REQUEST_DELAY_MS);
  return json;
}

// Cover Art Archive is a separate service (archive.org-backed), not
// subject to MusicBrainz's own rate limit.
async function coverArtUrl(releaseGroupId) {
  const url = `https://coverartarchive.org/release-group/${releaseGroupId}/front`;
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "manual" });
    if (res.status >= 300 && res.status < 400) return url;
    return null;
  } catch {
    return null;
  }
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

function normalizeName(s) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

async function resolveArtistMbid(name) {
  // Deliberately NOT the field-scoped `artist:"..."` phrase query: that
  // only matches the primary name field. An unqualified query also
  // searches aliases, which matters for artists MusicBrainz files under a
  // different current/legal name — e.g. Kanye West is on file as "Ye"
  // ("Kanye West" is listed only as an alias), and the phrase query
  // missed him entirely, falling back to "Kanye West Tribute Band".
  const url = `https://musicbrainz.org/ws/2/artist/?query=${encodeURIComponent(
    name,
  )}&fmt=json&limit=5`;
  const data = await mbFetch(url);
  const candidates = data.artists ?? [];
  if (candidates.length === 0) return null;

  // MusicBrainz's own relevance score isn't fully reliable either — a
  // tribute/cover act with the target's name embedded in its own name
  // (e.g. "Nick Phoenix" beating "Phoenix") has outranked the actual
  // artist before. Prefer a candidate whose primary name OR one of its
  // aliases matches exactly; only fall back to the top-scored result —
  // with a warning — when nothing matches exactly.
  const target = normalizeName(name);
  const exact = candidates.find(
    (c) =>
      normalizeName(c.name) === target ||
      (c.aliases ?? []).some((a) => normalizeName(a.name) === target),
  );
  if (exact) return exact;

  console.warn(
    `  ? "${name}" — pas de correspondance exacte, retenu au score : "${candidates[0].name}" (vérifier)`,
  );
  return candidates[0];
}

// Studio albums only: primary type Album, no secondary type (excludes
// Live/Compilation/Soundtrack/Remix/Mixtape/DJ-mix/Demo releases).
function topGenre(releaseGroup) {
  const genres = releaseGroup.genres ?? [];
  if (genres.length === 0) return null;
  return normalizeGenre([...genres].sort((a, b) => b.count - a.count)[0].name);
}

async function listStudioAlbums(mbid) {
  const url = `https://musicbrainz.org/ws/2/release-group?artist=${mbid}&type=album&inc=genres&fmt=json&limit=100`;
  const data = await mbFetch(url);
  return (data["release-groups"] ?? []).filter(
    (rg) =>
      rg["primary-type"] === "Album" &&
      (rg["secondary-types"] ?? []).length === 0 &&
      // MusicBrainz is crowd-sourced: an "Album" with no secondary type and
      // no documented release date is usually mislabeled fan data (radio
      // rips, bootleg compilations...) rather than a real studio album.
      Boolean(rg["first-release-date"]),
  );
}

async function pickRelease(releaseGroup) {
  const url = `https://musicbrainz.org/ws/2/release?release-group=${releaseGroup.id}&fmt=json&limit=25`;
  const data = await mbFetch(url);
  const releases = data.releases ?? [];
  if (releases.length === 0) return null;

  // Require an actually-released edition. Release-groups for leaked,
  // canceled, or bootlegged projects (very common for heavily-bootlegged
  // artists — e.g. Kanye West's "Yeezus II", "Yandhi") can still be typed
  // "Album" with no secondary type, but every one of their releases is
  // status "Bootleg"/"Promotion", never "Official". No official release
  // at all means we skip the whole album rather than import a fake one.
  const official = releases.filter((r) => r.status === "Official");
  if (official.length === 0) return null;

  const exactTitle = official.filter(
    (r) => r.title.toLowerCase() === releaseGroup.title.toLowerCase(),
  );
  const pool = exactTitle.length > 0 ? exactTitle : official;
  const preferredCountries = ["XE", "US", "GB", null];
  for (const country of preferredCountries) {
    const match = pool.find((r) => r.country === country);
    if (match) return match;
  }
  return pool[0];
}

async function importAlbumTracks(client, albumId, releaseId) {
  const url = `https://musicbrainz.org/ws/2/release/${releaseId}?inc=recordings&fmt=json`;
  const data = await mbFetch(url);
  const media = data.media ?? [];
  let trackCount = 0;
  let trackNumber = 0;
  for (const medium of media) {
    for (const track of medium.tracks ?? []) {
      trackNumber++;
      await client.query(
        `insert into public.tracks (album_id, track_number, title, duration_seconds)
         values ($1, $2, $3, $4)
         on conflict (album_id, track_number) do nothing`,
        [albumId, trackNumber, track.title ?? "Untitled", secondsFromMillis(track.length)],
      );
      trackCount++;
    }
  }
  return trackCount;
}

async function importArtist(client, artistName, stats) {
  let mbArtist;
  try {
    mbArtist = await resolveArtistMbid(artistName);
  } catch (err) {
    console.error(`  recherche échouée pour ${artistName}: ${err.message}`);
    stats.failed++;
    return;
  }
  if (!mbArtist) {
    console.warn(`  aucun artiste trouvé pour ${artistName}`);
    stats.notFound++;
    return;
  }

  let releaseGroups;
  try {
    releaseGroups = await listStudioAlbums(mbArtist.id);
  } catch (err) {
    console.error(`  albums introuvables pour ${mbArtist.name}: ${err.message}`);
    stats.failed++;
    return;
  }

  if (releaseGroups.length === 0) {
    console.log(`  aucun album studio trouvé pour ${mbArtist.name}`);
    return;
  }

  const artistId = await findOrCreateArtist(client, mbArtist.name);

  for (const rg of releaseGroups) {
    const title = rg.title.trim();
    const existing = await client.query(
      "select id from public.albums where artist_id = $1 and lower(title) = lower($2)",
      [artistId, title],
    );

    if (existing.rows.length > 0) {
      stats.albumsSkipped++;
      continue;
    }

    let release;
    try {
      release = await pickRelease(rg);
    } catch (err) {
      console.error(`    éditions introuvables pour "${title}": ${err.message}`);
      stats.failed++;
      continue;
    }
    if (!release) {
      console.warn(`  ? ${mbArtist.name} — ${title} : aucune édition avec tracklist, ignoré`);
      stats.uncertain++;
      continue;
    }

    const cover = await coverArtUrl(rg.id);
    const releaseDate = rg["first-release-date"] || null;
    const insertedAlbum = await client.query(
      `insert into public.albums (artist_id, title, cover_url, release_date, genre)
       values ($1, $2, $3, $4, $5) returning id`,
      [
        artistId,
        title,
        cover,
        releaseDate && releaseDate.length >= 10 ? releaseDate : null,
        topGenre(rg),
      ],
    );
    const albumId = insertedAlbum.rows[0].id;
    stats.albumsInserted++;
    console.log(`  + ${mbArtist.name} — ${title}`);

    try {
      const trackCount = await importAlbumTracks(client, albumId, release.id);
      stats.tracksInserted += trackCount;
    } catch (err) {
      console.error(`    tracklist échouée pour "${title}": ${err.message} — album retiré, sera retenté au prochain lancement`);
      // Roll back so this album isn't left stuck with zero tracks forever —
      // the dedup-by-title check would otherwise skip it on every rerun.
      await client.query("delete from public.albums where id = $1", [albumId]);
      stats.albumsInserted--;
      stats.failed++;
    }
  }
}

async function main() {
  const client = new Client({
    connectionString: loadDatabaseUrl(),
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();

  const stats = {
    albumsInserted: 0,
    albumsSkipped: 0,
    tracksInserted: 0,
    notFound: 0,
    uncertain: 0,
    failed: 0,
  };

  const only = process.env.ONLY
    ? new Set(process.env.ONLY.split(",").map((s) => s.trim().toLowerCase()))
    : null;
  const limit = Number(process.env.IMPORT_LIMIT) || ARTISTS.length;
  const artists = ARTISTS.filter((a) => !only || only.has(a.toLowerCase())).slice(0, limit);

  for (const artist of artists) {
    console.log(`Import : ${artist}`);
    await importArtist(client, artist, stats);
  }

  await client.end();
  console.log("\nTerminé.");
  console.log(`  ${stats.albumsInserted} albums ajoutés, ${stats.albumsSkipped} déjà présents.`);
  console.log(`  ${stats.tracksInserted} morceaux ajoutés.`);
  console.log(`  ${stats.notFound} artistes introuvables, ${stats.uncertain} albums sans édition exploitable, ${stats.failed} échecs réseau.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
