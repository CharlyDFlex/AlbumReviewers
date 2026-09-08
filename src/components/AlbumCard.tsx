import Image from "next/image";
import Link from "next/link";
import { StarDisplay } from "@/components/StarDisplay";
import { shouldSkipImageOptimization } from "@/lib/cover";
import { formatYear } from "@/lib/format";
import type { Artist, Album } from "@/lib/supabase/types";

export function AlbumCard({
  album,
  avgRating,
}: {
  album: Album & { artist: Pick<Artist, "id" | "name"> };
  avgRating?: number | null;
}) {
  return (
    <Link
      href={`/albums/${album.id}`}
      className="group flex shrink-0 flex-col gap-2 w-36 sm:w-40"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-md bg-surface border border-border flex items-center justify-center">
        {album.cover_url ? (
          <Image
            src={album.cover_url}
            alt={album.title}
            fill
            sizes="(min-width: 640px) 160px, 144px"
            unoptimized={shouldSkipImageOptimization(album.cover_url)}
            className="object-cover transition group-hover:scale-105"
          />
        ) : (
          <span className="text-muted text-xs text-center px-2">
            {album.title}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium group-hover:text-accent transition">
          {album.title}
        </p>
        <p className="truncate text-xs text-muted">
          {album.artist.name}
          {album.release_date ? ` · ${formatYear(album.release_date)}` : ""}
        </p>
        {album.genre && (
          <p className="truncate text-[11px] text-accent/80 mt-0.5">
            {album.genre}
          </p>
        )}
        {avgRating !== undefined && (
          <div className="mt-1">
            <StarDisplay rating={avgRating} size="text-xs" />
          </div>
        )}
      </div>
    </Link>
  );
}
