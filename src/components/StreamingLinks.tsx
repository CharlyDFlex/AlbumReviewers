const PLATFORMS = [
  {
    name: "Spotify",
    buildUrl: (q: string) => `https://open.spotify.com/search/${encodeURIComponent(q)}`,
  },
  {
    name: "Deezer",
    buildUrl: (q: string) => `https://www.deezer.com/search/${encodeURIComponent(q)}`,
  },
  {
    name: "Apple Music",
    buildUrl: (q: string) => `https://music.apple.com/search?term=${encodeURIComponent(q)}`,
  },
];

// We don't store per-platform catalog IDs (no partnership APIs wired up), so
// these are search-result links built from artist + title rather than deep
// links to the exact release — close enough to get the listener there in
// one click, and they work for every album without needing a re-import.
export function StreamingLinks({ artist, title }: { artist: string; title: string }) {
  const query = `${artist} ${title}`;

  return (
    <div className="flex flex-wrap gap-2">
      {PLATFORMS.map((platform) => (
        <a
          key={platform.name}
          href={platform.buildUrl(query)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted hover:border-accent hover:text-foreground transition"
        >
          {platform.name}
        </a>
      ))}
    </div>
  );
}
