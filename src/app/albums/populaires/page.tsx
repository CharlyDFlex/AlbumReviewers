import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { StarDisplay } from "@/components/StarDisplay";
import { shouldSkipImageOptimization } from "@/lib/cover";

const TOP_N = 100;

export default async function PopularAlbumsPage() {
  const t = await getTranslations("PopularAlbums");
  const supabase = await createClient();
  const { data: albums } = await supabase
    .from("albums")
    .select("*, artist:artists(*)")
    .order("ratings_count", { ascending: false })
    .order("avg_rating", { ascending: false, nullsFirst: false })
    .limit(TOP_N);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-sm text-muted mt-1">{t("subtitle")}</p>
        </div>
        <Link href="/albums?sort=popular" className="text-sm text-accent hover:underline">
          {t("fullCatalog")}
        </Link>
      </div>

      <ol className="flex flex-col gap-2">
        {albums?.map((album, i) => (
          <li key={album.id}>
            <Link
              href={`/albums/${album.id}`}
              className="flex items-center gap-4 rounded-lg border border-border bg-surface p-3 hover:border-accent transition"
            >
              <span className="w-8 shrink-0 text-center text-lg font-bold text-muted">
                {i + 1}
              </span>
              {album.cover_url ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-border">
                  <Image
                    src={album.cover_url}
                    alt={album.title}
                    fill
                    sizes="56px"
                    unoptimized={shouldSkipImageOptimization(album.cover_url)}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-14 w-14 shrink-0 rounded bg-background border border-border" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{album.title}</p>
                <p className="truncate text-sm text-muted">{album.artist.name}</p>
              </div>
              <div className="shrink-0 text-right">
                <StarDisplay rating={album.avg_rating} size="text-sm" />
                <p className="text-xs text-muted mt-0.5">
                  {t("ratingsCount", { count: album.ratings_count })}
                </p>
              </div>
            </Link>
          </li>
        ))}
        {albums?.length === 0 && (
          <p className="text-muted text-sm">{t("noRatedAlbumsYet")}</p>
        )}
      </ol>
    </div>
  );
}
