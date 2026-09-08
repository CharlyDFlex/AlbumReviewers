// Cover Art Archive (archive.org-backed, used for ~58% of imported covers —
// see scripts/import-musicbrainz.mjs) has been observed taking 10-15s to
// respond, well past Next's hardcoded ~7s image-optimizer fetch timeout.
// Routing it through the optimizer turns "slow" into "broken" (500), so we
// skip optimization for that host specifically and let the browser fetch
// it directly instead — slow, but it actually loads.
export function shouldSkipImageOptimization(url: string): boolean {
  return url.includes("coverartarchive.org");
}
