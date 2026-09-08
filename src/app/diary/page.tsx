import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { StarDisplay } from "@/components/StarDisplay";
import { shouldSkipImageOptimization } from "@/lib/cover";
import { formatDate } from "@/lib/format";
import { INTL_TAGS } from "@/i18n/locales";

export default async function DiaryPage() {
  const t = await getTranslations("Diary");
  const locale = await getLocale();
  const intlLocale = INTL_TAGS[locale];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: listens }, { data: ratings }] = await Promise.all([
    supabase
      .from("listens")
      .select("*, album:albums(*, artist:artists(*))")
      .eq("user_id", user.id)
      .order("listened_at", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("album_ratings").select("album_id, rating").eq("user_id", user.id),
  ]);
  const ratingByAlbum = new Map((ratings ?? []).map((r) => [r.album_id, r.rating]));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
      <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
        {listens?.map((listen) => (
          <Link
            key={listen.id}
            href={`/albums/${listen.album.id}`}
            className="flex items-center gap-4 p-4 hover:bg-surface-hover transition"
          >
            {listen.album.cover_url ? (
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-border">
                <Image
                  src={listen.album.cover_url}
                  alt={listen.album.title}
                  fill
                  sizes="56px"
                  unoptimized={shouldSkipImageOptimization(listen.album.cover_url)}
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="h-14 w-14 rounded bg-background border border-border shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{listen.album.title}</p>
              <p className="text-sm text-muted truncate">
                {listen.album.artist.name}
              </p>
            </div>
            <div className="text-right shrink-0">
              <StarDisplay
                rating={ratingByAlbum.get(listen.album.id) ?? null}
                size="text-xs"
              />
              <p className="text-xs text-muted mt-1">
                {formatDate(listen.listened_at, intlLocale)}
              </p>
            </div>
          </Link>
        ))}
        {listens?.length === 0 && (
          <p className="p-4 text-sm text-muted">
            {t.rich("empty", {
              link: (chunks) => (
                <Link href="/albums" className="text-accent hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        )}
      </div>
    </div>
  );
}
