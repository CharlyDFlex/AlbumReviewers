// Next.js (Turbopack dev server) can normalize `request.url`'s host to
// "localhost" even when the browser actually connected via a different
// host (e.g. 127.0.0.1) — which breaks anything that must round-trip an
// exact origin, like an OAuth redirect_uri. Reading the incoming `Host`
// header directly reflects what the client really sent.
export function getRequestOrigin(request: Request): string {
  const host = request.headers.get("host") ?? new URL(request.url).host;
  const protocol = request.headers.get("x-forwarded-proto") ?? "http";
  return `${protocol}://${host}`;
}
