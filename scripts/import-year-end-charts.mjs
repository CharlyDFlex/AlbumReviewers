#!/usr/bin/env node
// Imports the top-20 biggest albums of each year (2016-2025, see
// year-end-charts-data.mjs) from the iTunes Search API, matching each
// chart entry to its canonical iTunes album so slightly different chart
// labels for the same record (e.g. "÷" vs "Divide") collapse into one row.
//
// Same connection approach as import-itunes.mjs: writes straight to
// Postgres via DATABASE_URL, bypassing the anon key's RLS policies.
//
// Usage: npm run import:charts

import { Client } from "pg";
import { readFileSync, existsSync } from "node:fs";
import { YEAR_END_CHARTS } from "./year-end-charts-data.mjs";

const REQUEST_DELAY_MS = 700;

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

function normalize(s) {
  // NFD splits accented letters into base + combining mark, and the
  // a-z0-9 filter below then drops the (non-alphanumeric) combining marks
  // — e.g. "é" -> "e" + U+0301 -> "e".
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

// Higher is better; 0 means "no real match found".
function titleScore(target, candidate) {
  const nt = normalize(target);
  const nc = normalize(candidate);
  if (!nt || !nc) return 0;
  if (nt === nc) return 3;
  if (nc.includes(nt) || nt.includes(nc)) return 2;
  const tWords = new Set(nt.split(" ").filter(Boolean));
  const cWords = new Set(nc.split(" ").filter(Boolean));
  const overlap = [...tWords].filter((w) => cWords.has(w)).length;
  if (overlap >= Math.min(2, tWords.size)) return 1;
  return 0;
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

// Search scoped to the artist field first (attribute=artistTerm), so title
// matching only ever competes within that artist's own catalog — this is
// what keeps a generic title like "Gold: Greatest Hits" from matching a
// same-titled album by a completely different artist. Falls back to a
// plain combined "artist title" search if the artist-scoped one comes up
// empty (e.g. artist name spelled differently on iTunes).
async function searchArtistAlbums(chartArtist) {
  const scopedUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(
    chartArtist,
  )}&entity=album&attribute=artistTerm&limit=50&media=music`;
  const data = await fetchJson(scopedUrl);
  await sleep(REQUEST_DELAY_MS);
  return (data.results ?? []).filter((r) => r.collectionType === "Album");
}

async function searchCombined(chartArtist, chartTitle) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
    `${chartArtist} ${chartTitle}`,
  )}&entity=album&limit=5&media=music`;
  const data = await fetchJson(url);
  await sleep(REQUEST_DELAY_MS);
  return (data.results ?? []).filter((r) => r.collectionType === "Album");
}

function pickBest(results, chartTitle) {
  let best = results[0];
  let bestScore = titleScore(chartTitle, best.collectionName);
  for (const r of results.slice(1)) {
    const score = titleScore(chartTitle, r.collectionName);
    if (score > bestScore) {
      best = r;
      bestScore = score;
    }
  }
  return { best, bestScore };
}

async function importChartEntry(client, year, rank, chartArtist, chartTitle, stats) {
  const label = `${year} #${rank}: ${chartArtist} — ${chartTitle}`;

  let results;
  try {
    results = await searchArtistAlbums(chartArtist);
    if (results.length === 0) {
      results = await searchCombined(chartArtist, chartTitle);
    }
  } catch (err) {
    console.error(`  ✗ ${label} — recherche échouée : ${err.message}`);
    stats.failed++;
    return;
  }

  if (results.length === 0) {
    console.warn(`  ? ${label} — aucun résultat iTunes`);
    stats.notFound++;
    return;
  }

  let { best, bestScore } = pickBest(results, chartTitle);
  if (bestScore === 0) {
    // The artist-scoped search returned albums, but none of their titles
    // matched — try the combined search before giving up on a good match.
    try {
      const fallbackResults = await searchCombined(chartArtist, chartTitle);
      if (fallbackResults.length > 0) {
        const fallback = pickBest(fallbackResults, chartTitle);
        if (fallback.bestScore > bestScore) {
          best = fallback.best;
          bestScore = fallback.bestScore;
        }
      }
    } catch {
      // Keep the artist-scoped best-effort result below.
    }
  }
  if (bestScore === 0) {
    // No candidate title actually matches — inserting the top result anyway
    // would silently attribute the wrong album to this chart entry (this is
    // how "Brat" ends up missing: it isn't indexed by iTunes Search at all,
    // in any store we tried, so every candidate here is a different album).
    // Skipping is safer than a confident-looking wrong answer.
    console.warn(`  ? ${label} — aucune correspondance fiable, ignoré (le plus proche était "${best.collectionName}" par ${best.artistName})`);
    stats.uncertain++;
    return;
  }

  const artistId = await findOrCreateArtist(client, best.artistName);
  const title = best.collectionName.trim();

  const existing = await client.query(
    "select id from public.albums where artist_id = $1 and lower(title) = lower($2)",
    [artistId, title],
  );

  let albumId;
  if (existing.rows.length > 0) {
    albumId = existing.rows[0].id;
    stats.albumsSkipped++;
  } else {
    const releaseDate = best.releaseDate ? best.releaseDate.slice(0, 10) : null;
    const inserted = await client.query(
      `insert into public.albums (artist_id, title, cover_url, release_date)
       values ($1, $2, $3, $4) returning id`,
      [artistId, title, upgradeArtwork(best.artworkUrl100), releaseDate],
    );
    albumId = inserted.rows[0].id;
    stats.albumsInserted++;
    console.log(`  + ${label} → ${best.artistName} — ${title}`);
  }

  try {
    const trackCount = await importAlbumTracks(client, albumId, best.collectionId);
    stats.tracksInserted += trackCount;
  } catch (err) {
    console.error(`    tracklist échouée pour "${title}": ${err.message}`);
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

  const yearFilter = process.env.YEARS
    ? new Set(process.env.YEARS.split(",").map((y) => Number(y.trim())))
    : null;
  const years = Object.keys(YEAR_END_CHARTS)
    .map(Number)
    .filter((y) => !yearFilter || yearFilter.has(y))
    .sort((a, b) => a - b);

  for (const year of years) {
    console.log(`\n=== ${year} ===`);
    const entries = YEAR_END_CHARTS[year];
    for (let i = 0; i < entries.length; i++) {
      const [artist, title] = entries[i];
      await importChartEntry(client, year, i + 1, artist, title, stats);
    }
  }

  await client.end();
  console.log("\nTerminé.");
  console.log(`  ${stats.albumsInserted} albums ajoutés, ${stats.albumsSkipped} déjà présents.`);
  console.log(`  ${stats.tracksInserted} morceaux ajoutés.`);
  console.log(`  ${stats.notFound} sans résultat iTunes, ${stats.uncertain} correspondances incertaines, ${stats.failed} échecs réseau.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
