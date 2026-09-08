import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AlbumCard } from "@/components/AlbumCard";
import { ScrollRow } from "@/components/ScrollRow";
import { StarDisplay } from "@/components/StarDisplay";
import { formatDate, formatMonthYear } from "@/lib/format";
import { shouldSkipImageOptimization } from "@/lib/cover";
import { INTL_TAGS } from "@/i18n/locales";
import type { Album, Artist } from "@/lib/supabase/types";

const ROW_SIZE = 10;

export default async function HomePage() {
  const t = await getTranslations("Home");
  const locale = await getLocale();
  const intlLocale = INTL_TAGS[locale];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [{ data: monthAlbums }, { data: popularAlbums }, { data: recentReviews }] =
    await Promise.all([
      supabase
        .from("albums")
        .select("*, artist:artists(*)")
        .gte("release_date", monthStart.toISOString().slice(0, 10))
        .lt("release_date", monthEnd.toISOString().slice(0, 10))
        .order("release_date", { ascending: false })
        .limit(ROW_SIZE),
      supabase
        .from("albums")
        .select("*, artist:artists(*)")
        .order("ratings_count", { ascending: false })
        .order("avg_rating", { ascending: false, nullsFirst: false })
        .limit(ROW_SIZE),
      supabase
        .from("album_ratings")
        .select(
          "*, album:albums(*, artist:artists(*)), profile:profiles(username, display_name)",
        )
        .not("review", "is", null)
        .order("updated_at", { ascending: false })
        .limit(8),
    ]);

  let randomAlbums: (Album & { artist: Pick<Artist, "id" | "name"> })[] = [];
  if (user) {
    const { data: randomRows } = await supabase.rpc("random_unlistened_albums", {
      target_user_id: user.id,
      result_limit: ROW_SIZE,
    });
    if (randomRows && randomRows.length > 0) {
      const artistIds = [...new Set(randomRows.map((a) => a.artist_id))];
      const { data: artists } = await supabase
        .from("artists")
        .select("*")
        .in("id", artistIds);
      const artistById = new Map((artists ?? []).map((a) => [a.id, a]));
      randomAlbums = randomRows.flatMap((a) => {
        const artist = artistById.get(a.artist_id);
        return artist ? [{ ...a, artist }] : [];
      });
    }
  }

  return (
    <div className="flex flex-col gap-12">
      {!user && (
        <section className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
          <h1 className="text-3xl font-bold mb-2">{t("heroTitle")}</h1>
          <p className="text-muted mb-6 max-w-xl mx-auto">{t("heroSubtitle")}</p>
          <div className="flex justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-accent px-5 py-2.5 font-medium text-black hover:bg-accent-hover transition"
            >
              {t("createAccount")}
            </Link>
            <Link
              href="/albums"
              className="rounded-full border border-border px-5 py-2.5 font-medium hover:bg-surface-hover transition"
            >
              {t("browseAlbums")}
            </Link>
          </div>
        </section>
      )}

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl font-semibold">
            {t("releasesThisMonth", { month: formatMonthYear(monthStart, intlLocale) })}
          </h2>
          <Link href="/albums/mois" className="text-sm text-accent hover:underline">
            {t("seeAll")}
          </Link>
        </div>
        {monthAlbums && monthAlbums.length > 0 ? (
          <ScrollRow>
            {monthAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} avgRating={album.avg_rating} />
            ))}
          </ScrollRow>
        ) : (
          <p className="text-muted text-sm">{t("noReleasesThisMonth")}</p>
        )}
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl font-semibold">{t("mostListened")}</h2>
          <Link
            href="/albums/populaires"
            className="text-sm text-accent hover:underline"
          >
            {t("seeAll")}
          </Link>
        </div>
        {popularAlbums && popularAlbums.length > 0 ? (
          <ScrollRow>
            {popularAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} avgRating={album.avg_rating} />
            ))}
          </ScrollRow>
        ) : (
          <p className="text-muted text-sm">{t("noRatedAlbumsYet")}</p>
        )}
      </section>

      {user && randomAlbums.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-semibold">{t("discover")}</h2>
            <span className="text-sm text-muted">{t("discoverSubtitle")}</span>
          </div>
          <ScrollRow>
            {randomAlbums.map((album) => (
              <AlbumCard key={album.id} album={album} avgRating={album.avg_rating} />
            ))}
          </ScrollRow>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-4">{t("recentReviews")}</h2>
        <div className="flex flex-col gap-4">
          {recentReviews?.map((r) => (
            <article
              key={r.id}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-start gap-3">
                <Link href={`/albums/${r.album.id}`} className="shrink-0">
                  {r.album.cover_url ? (
                    <div className="relative h-16 w-16 overflow-hidden rounded border border-border">
                      <Image
                        src={r.album.cover_url}
                        alt={r.album.title}
                        fill
                        sizes="64px"
                        unoptimized={shouldSkipImageOptimization(r.album.cover_url)}
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded bg-background border border-border" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted">
                    {t.rich("reviewLine", {
                      userName: r.profile.display_name || r.profile.username,
                      albumTitle: r.album.title,
                      artist: r.album.artist.name,
                      user: (chunks) => (
                        <Link
                          href={`/profile/${r.profile.username}`}
                          className="font-medium text-foreground hover:text-accent"
                        >
                          {chunks}
                        </Link>
                      ),
                      album: (chunks) => (
                        <Link
                          href={`/albums/${r.album.id}`}
                          className="font-medium text-foreground hover:text-accent"
                        >
                          {chunks}
                        </Link>
                      ),
                    })}
                  </p>
                  <div className="mt-1">
                    <StarDisplay rating={r.rating} size="text-sm" />
                  </div>
                  {r.review && (
                    <p className="mt-2 text-sm text-foreground/90 line-clamp-3">
                      {r.review}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    {formatDate(r.updated_at, intlLocale)}
                  </p>
                </div>
              </div>
            </article>
          ))}
          {recentReviews?.length === 0 && (
            <p className="text-muted text-sm">{t("noReviewsYet")}</p>
          )}
        </div>
      </section>
    </div>
  );
}
