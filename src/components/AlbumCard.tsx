import Link from "next/link";
import { StarDisplay } from "@/components/StarDisplay";
import { AlbumSleeve } from "@/components/AlbumSleeve";
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
      className="group relative flex shrink-0 flex-col gap-2 w-36 sm:w-40 outline-none hover:z-10 focus-visible:z-10"
    >
      {/* Right padding leaves room for the record to slide out on hover */}
      <div className="pr-3">
        <AlbumSleeve
          coverUrl={album.cover_url}
          title={album.title}
          sizes="(min-width: 640px) 160px, 144px"
        />
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
