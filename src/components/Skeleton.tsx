export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface ${className}`} />;
}

function SkeletonAlbumCard() {
  return (
    <div className="flex shrink-0 flex-col gap-2 w-36 sm:w-40">
      <SkeletonBlock className="aspect-square w-full rounded-md" />
      <SkeletonBlock className="h-4 w-3/4" />
      <SkeletonBlock className="h-3 w-1/2" />
    </div>
  );
}

export function SkeletonAlbumRow({ count = 6 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-x-hidden pb-2">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonAlbumCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonAlbumGrid({ count = 24 }: { count?: number }) {
  return (
    <div className="flex flex-wrap gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonAlbumCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonRows({ count = 6 }: { count?: number }) {
  return (
    <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-3">
          <SkeletonBlock className="h-12 w-12 shrink-0 rounded" />
          <div className="flex-1 flex flex-col gap-2">
            <SkeletonBlock className="h-4 w-1/2" />
            <SkeletonBlock className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
