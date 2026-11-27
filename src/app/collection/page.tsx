import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { CollectionShelf, type CollectionItem } from "@/components/CollectionShelf";

// Your record collection = every album you've logged at least once in your
// diary. Each album appears once, however many times you've listened to it.
export default async function CollectionPage() {
  const t = await getTranslations("Collection");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: listens }, { data: ratings }] = await Promise.all([
    supabase
      .from("listens")
      .select("album_id, listened_at, album:albums(id, title, cover_url, release_date, genre, artist:artists(id, name))")
      .eq("user_id", user.id)
      .order("listened_at", { ascending: false }),
    supabase.from("album_ratings").select("album_id, rating").eq("user_id", user.id),
  ]);
  const ratingByAlbum = new Map((ratings ?? []).map((r) => [r.album_id, r.rating]));

  // Listens come newest-first, so the first time we see an album is its
  // most recent spin.
  const byAlbum = new Map<string, CollectionItem>();
  for (const listen of listens ?? []) {
    const album = listen.album;
    if (!album) continue;
    const existing = byAlbum.get(album.id);
    if (existing) {
      existing.plays += 1;
      continue;
    }
    byAlbum.set(album.id, {
      id: album.id,
      title: album.title,
      coverUrl: album.cover_url,
      releaseDate: album.release_date,
      genre: album.genre,
      artistName: album.artist.name,
      lastPlayedAt: listen.listened_at,
      plays: 1,
      rating: ratingByAlbum.get(album.id) ?? null,
    });
  }
  const items = [...byAlbum.values()];

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">
            {t("subtitle", { count: items.length })}
          </p>
        </div>
        <Link href="/diary" className="text-sm text-muted hover:text-accent transition">
          {t("openDiary")} →
        </Link>
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-10 text-center">
          <p className="text-muted">
            {t.rich("empty", {
              link: (chunks) => (
                <Link href="/albums" className="text-accent hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </div>
      ) : (
        <CollectionShelf items={items} />
      )}
    </div>
  );
}
