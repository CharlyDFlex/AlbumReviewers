// Shared by import-itunes.mjs and import-musicbrainz.mjs. The two sources
// disagree on casing (iTunes: "Electronic", MusicBrainz tags: "electronic"),
// which fragments the /albums genre filter into duplicate buckets unless
// normalized to a single casing before insert — mirrors Postgres's
// initcap(), which is what already normalized the existing catalog.
export function normalizeGenre(genre) {
  if (!genre) return null;
  return genre.replace(
    /[a-zA-Z]+/g,
    (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
  );
}
