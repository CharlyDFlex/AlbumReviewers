import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

const nextConfig: NextConfig = {
  images: {
    // Every album cover currently comes from one of these two sources
    // (see scripts/import-itunes.mjs and scripts/import-musicbrainz.mjs).
    // A manually-added cover_url from a different host would need its own
    // pattern added here — next/image refuses to optimize unlisted domains.
    remotePatterns: [
      { protocol: "https", hostname: "*.mzstatic.com" },
      { protocol: "https", hostname: "coverartarchive.org" },
    ],
  },
};

export default withNextIntl(nextConfig);
