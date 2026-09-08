import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AlbumCard } from "@/components/AlbumCard";
import { StarDisplay } from "@/components/StarDisplay";
import { formatDate } from "@/lib/format";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: newAlbums }, { data: recentReviews }] = await Promise.all([
    supabase
      .from("albums")
      .select("*, artist:artists(*)")
      .order("created_at", { ascending: false })
      .limit(12),
    supabase
      .from("album_ratings")
      .select(
        "*, album:albums(*, artist:artists(*)), profile:profiles(username, display_name)",
      )
      .not("review", "is", null)
      .order("updated_at", { ascending: false })
      .limit(8),
  ]);

  let notListened: typeof newAlbums = [];
  if (user && newAlbums && newAlbums.length > 0) {
    const { data: listened } = await supabase
      .from("listens")
      .select("album_id")
      .eq("user_id", user.id)
      .in(
        "album_id",
        newAlbums.map((a) => a.id),
      );
    const listenedIds = new Set((listened ?? []).map((l) => l.album_id));
    notListened = newAlbums.filter((a) => !listenedIds.has(a.id));
  }

  return (
    <div className="flex flex-col gap-12">
      {!user && (
        <section className="rounded-xl border border-border bg-surface px-6 py-10 text-center">
          <h1 className="text-3xl font-bold mb-2">
            Suis les albums que tu écoutes.
          </h1>
          <p className="text-muted mb-6 max-w-xl mx-auto">
            Note les albums et les morceaux, écris des critiques, garde un
            journal d&apos;écoute et construis ta liste à écouter — comme
            Letterboxd, mais pour la musique.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              href="/signup"
              className="rounded-full bg-accent px-5 py-2.5 font-medium text-black hover:bg-accent-hover transition"
            >
              Créer un compte
            </Link>
            <Link
              href="/albums"
              className="rounded-full border border-border px-5 py-2.5 font-medium hover:bg-surface-hover transition"
            >
              Parcourir les albums
            </Link>
          </div>
        </section>
      )}

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <h2 className="text-xl font-semibold">Nouveaux albums</h2>
          <Link href="/albums" className="text-sm text-accent hover:underline">
            Voir tout
          </Link>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {newAlbums?.map((album) => (
            <AlbumCard key={album.id} album={album} />
          ))}
          {newAlbums?.length === 0 && (
            <p className="text-muted text-sm">
              Aucun album pour l&apos;instant. Ajoute-en depuis Supabase pour
              commencer.
            </p>
          )}
        </div>
      </section>

      {user && notListened.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-semibold">Tu n&apos;as pas encore écouté</h2>
            <Link
              href="/watchlist"
              className="text-sm text-accent hover:underline"
            >
              Ma liste à écouter
            </Link>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {notListened.slice(0, 8).map((album) => (
              <AlbumCard key={album.id} album={album} />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-semibold mb-4">Avis récents</h2>
        <div className="flex flex-col gap-4">
          {recentReviews?.map((r) => (
            <article
              key={r.id}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-start gap-3">
                <Link href={`/albums/${r.album.id}`} className="shrink-0">
                  {r.album.cover_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={r.album.cover_url}
                      alt={r.album.title}
                      className="h-16 w-16 rounded object-cover border border-border"
                    />
                  ) : (
                    <div className="h-16 w-16 rounded bg-background border border-border" />
                  )}
                </Link>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-muted">
                    <Link
                      href={`/profile/${r.profile.username}`}
                      className="font-medium text-foreground hover:text-accent"
                    >
                      {r.profile.display_name || r.profile.username}
                    </Link>{" "}
                    a noté{" "}
                    <Link
                      href={`/albums/${r.album.id}`}
                      className="font-medium text-foreground hover:text-accent"
                    >
                      {r.album.title}
                    </Link>{" "}
                    · {r.album.artist.name}
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
                    {formatDate(r.updated_at)}
                  </p>
                </div>
              </div>
            </article>
          ))}
          {recentReviews?.length === 0 && (
            <p className="text-muted text-sm">Aucun avis pour l&apos;instant.</p>
          )}
        </div>
      </section>
    </div>
  );
}
