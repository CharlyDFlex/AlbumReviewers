import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AlbumCard } from "@/components/AlbumCard";
import { formatMonthYear } from "@/lib/format";
import { INTL_TAGS } from "@/i18n/locales";

export default async function AlbumsThisMonthPage() {
  const t = await getTranslations("AlbumsThisMonth");
  const locale = await getLocale();
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const supabase = await createClient();
  const { data: albums } = await supabase
    .from("albums")
    .select("*, artist:artists(*)")
    .gte("release_date", monthStart.toISOString().slice(0, 10))
    .lt("release_date", monthEnd.toISOString().slice(0, 10))
    .order("release_date", { ascending: false });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold">
          {t("title", { month: formatMonthYear(monthStart, INTL_TAGS[locale]) })}
        </h1>
        <Link href="/albums" className="text-sm text-accent hover:underline">
          {t("fullCatalog")}
        </Link>
      </div>

      <div className="flex flex-wrap gap-4">
        {albums?.map((album) => (
          <AlbumCard key={album.id} album={album} avgRating={album.avg_rating} />
        ))}
        {albums?.length === 0 && (
          <p className="text-muted text-sm">{t("noReleasesThisMonth")}</p>
        )}
      </div>
    </div>
  );
}
