import Link from "next/link";
import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AlbumCard } from "@/components/AlbumCard";
import { AlbumFilters } from "@/components/AlbumFilters";

const PAGE_SIZE = 60;

export default async function AlbumsPage(props: PageProps<"/albums">) {
  const t = await getTranslations("Albums");
  const params = await props.searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const genre = typeof params.genre === "string" ? params.genre : "";
  const yearParam = typeof params.year === "string" ? params.year : "";
  const year = /^\d{4}$/.test(yearParam) ? yearParam : "";
  const sort = typeof params.sort === "string" ? params.sort : "title";
  const page = Math.max(1, Math.trunc(Number(params.page)) || 1);

  const supabase = await createClient();

  const [{ data: genreRows }, { data: yearRows }] = await Promise.all([
    supabase.rpc("distinct_album_genres"),
    supabase.rpc("distinct_album_years"),
  ]);
  const genres = (genreRows ?? []).map((r) => r.genre);
  const years = (yearRows ?? []).map((r) => r.year);

  let query = supabase
    .from("albums")
    .select("*, artist:artists(*)", { count: "exact" });

  if (genre) query = query.eq("genre", genre);
  if (year) {
    query = query
      .gte("release_date", `${year}-01-01`)
      .lt("release_date", `${Number(year) + 1}-01-01`);
  }

  if (q) {
    // PostgREST's `.or()` mini-language treats `,` and `(` `)` as syntax
    // (condition separator / grouping), so a raw search term containing
    // them would corrupt the filter rather than just fail to match —
    // strip them rather than trying to escape them.
    const safeQ = q.replace(/[(),]/g, "");
    const { data: matchingArtists } = await supabase
      .from("artists")
      .select("id")
      .ilike("name", `%${safeQ}%`);
    const artistIds = (matchingArtists ?? []).map((a) => a.id);
    const orParts = [`title.ilike.%${safeQ}%`];
    if (artistIds.length > 0) {
      orParts.push(`artist_id.in.(${artistIds.join(",")})`);
    }
    query = query.or(orParts.join(","));
  }

  if (sort === "recent") {
    query = query.order("release_date", { ascending: false, nullsFirst: false });
  } else if (sort === "newest") {
    query = query.order("created_at", { ascending: false });
  } else if (sort === "popular") {
    query = query
      .order("ratings_count", { ascending: false })
      .order("avg_rating", { ascending: false, nullsFirst: false });
  } else {
    query = query.order("title", { ascending: true });
  }

  const offset = (page - 1) * PAGE_SIZE;
  const { data: albums, count } = await query.range(offset, offset + PAGE_SIZE - 1);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  function pageHref(p: number) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (genre) sp.set("genre", genre);
    if (year) sp.set("year", year);
    if (sort !== "title") sp.set("sort", sort);
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/albums${qs ? `?${qs}` : ""}`;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">
          {q ? t("resultsFor", { query: q }) : t("allAlbums")}
        </h1>
        <Suspense fallback={null}>
          <AlbumFilters genres={genres} years={years} />
        </Suspense>
      </div>

      <div className="flex flex-wrap gap-4">
        {albums?.map((album) => (
          <AlbumCard key={album.id} album={album} avgRating={album.avg_rating} />
        ))}
        {albums?.length === 0 && (
          <p className="text-muted text-sm">{t("noAlbumsFound")}</p>
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4 text-sm">
          {page > 1 ? (
            <Link href={pageHref(page - 1)} className="text-accent hover:underline">
              {t("prev")}
            </Link>
          ) : (
            <span className="text-muted">{t("prev")}</span>
          )}
          <span className="text-muted">{t("pageOf", { page, total: totalPages })}</span>
          {page < totalPages ? (
            <Link href={pageHref(page + 1)} className="text-accent hover:underline">
              {t("next")}
            </Link>
          ) : (
            <span className="text-muted">{t("next")}</span>
          )}
        </div>
      )}
    </div>
  );
}
