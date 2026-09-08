import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StarDisplay } from "@/components/StarDisplay";
import { TrackRow } from "@/components/TrackRow";
import { AlbumRatingForm } from "@/components/AlbumRatingForm";
import { SubmitButton } from "@/components/SubmitButton";
import { formatDate, formatYear, average } from "@/lib/format";
import { logListen, deleteListen, toggleWatchlist } from "@/app/albums/[id]/actions";

export default async function AlbumPage(props: PageProps<"/albums/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: album }, { data: tracks }, { data: ratings }] = await Promise.all([
    supabase.from("albums").select("*, artist:artists(*)").eq("id", id).single(),
    supabase.from("tracks").select("*").eq("album_id", id).order("track_number"),
    supabase
      .from("album_ratings")
      .select("*, profile:profiles(username, display_name)")
      .eq("album_id", id)
      .order("updated_at", { ascending: false }),
  ]);

  if (!album) notFound();

  const trackIds = (tracks ?? []).map((t) => t.id);
  const { data: trackRatings } =
    trackIds.length > 0
      ? await supabase.from("track_ratings").select("*").in("track_id", trackIds)
      : { data: [] as { track_id: string; rating: number; user_id: string }[] };

  let myListens: { id: string; listened_at: string }[] = [];
  let myWatchlistEntry: { id: string } | null = null;
  if (user) {
    const [{ data: listens }, { data: watch }] = await Promise.all([
      supabase
        .from("listens")
        .select("id, listened_at")
        .eq("album_id", id)
        .eq("user_id", user.id)
        .order("listened_at", { ascending: false }),
      supabase
        .from("watchlist")
        .select("id")
        .eq("album_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    myListens = listens ?? [];
    myWatchlistEntry = watch ?? null;
  }

  const ratedValues = (ratings ?? [])
    .map((r) => r.rating)
    .filter((r): r is number => r != null);
  const avgAlbumRating = average(ratedValues);
  const myRating = user ? ratings?.find((r) => r.user_id === user.id) ?? null : null;
  const otherReviews = (ratings ?? []).filter(
    (r) => r.review && (!user || r.user_id !== user.id),
  );

  const trackRatingsByTrack = new Map<
    string,
    { values: number[]; mine: number | null }
  >();
  for (const t of tracks ?? []) trackRatingsByTrack.set(t.id, { values: [], mine: null });
  for (const tr of trackRatings ?? []) {
    const entry = trackRatingsByTrack.get(tr.track_id);
    if (!entry) continue;
    entry.values.push(tr.rating);
    if (user && tr.user_id === user.id) entry.mine = tr.rating;
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row gap-6">
        <div className="w-48 shrink-0 mx-auto sm:mx-0">
          <div className="aspect-square w-full overflow-hidden rounded-lg bg-surface border border-border flex items-center justify-center">
            {album.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={album.cover_url}
                alt={album.title}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-muted text-sm text-center px-3">
                {album.title}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold">{album.title}</h1>
          <Link
            href={`/artists/${album.artist.id}`}
            className="text-lg text-muted hover:text-accent transition"
          >
            {album.artist.name}
          </Link>
          <p className="text-sm text-muted mt-1">
            {formatYear(album.release_date)}
          </p>

          <div className="mt-3 flex items-center gap-3">
            <StarDisplay rating={avgAlbumRating} size="text-lg" showValue />
            <span className="text-sm text-muted">
              ({ratedValues.length} note{ratedValues.length > 1 ? "s" : ""})
            </span>
          </div>

          {album.description && (
            <p className="mt-4 text-sm text-foreground/80 max-w-2xl">
              {album.description}
            </p>
          )}

          {user ? (
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <form action={logListen}>
                <input type="hidden" name="albumId" value={album.id} />
                <SubmitButton
                  pendingText="..."
                  className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-black hover:bg-accent-hover transition cursor-pointer disabled:opacity-60"
                >
                  {myListens.length > 0 ? "Ré-écouté ✓" : "Marquer comme écouté"}
                </SubmitButton>
              </form>
              <form action={toggleWatchlist}>
                <input type="hidden" name="albumId" value={album.id} />
                <input
                  type="hidden"
                  name="isOnWatchlist"
                  value={String(!!myWatchlistEntry)}
                />
                <SubmitButton
                  pendingText="..."
                  className="rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:bg-surface-hover transition cursor-pointer disabled:opacity-60"
                >
                  {myWatchlistEntry ? "Retirer de à écouter" : "Ajouter à écouter"}
                </SubmitButton>
              </form>
              {myListens.length > 0 && (
                <span className="text-xs text-muted">
                  Écouté {myListens.length} fois · dernière fois le{" "}
                  {formatDate(myListens[0].listened_at)}
                </span>
              )}
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted">
              <Link href="/login" className="text-accent hover:underline">
                Connecte-toi
              </Link>{" "}
              pour noter, écrire une critique et suivre tes écoutes.
            </p>
          )}
        </div>
      </div>

      {user && myListens.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Ton journal pour cet album</h2>
          <ul className="flex flex-col gap-1">
            {myListens.map((listen) => (
              <li
                key={listen.id}
                className="flex items-center justify-between text-sm text-muted"
              >
                <span>Écouté le {formatDate(listen.listened_at)}</span>
                <form action={deleteListen}>
                  <input type="hidden" name="listenId" value={listen.id} />
                  <input type="hidden" name="albumId" value={album.id} />
                  <SubmitButton
                    pendingText="..."
                    className="text-xs text-muted hover:text-danger cursor-pointer"
                  >
                    supprimer
                  </SubmitButton>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-2">Morceaux</h2>
        <div className="rounded-lg border border-border bg-surface px-4">
          {(tracks ?? []).map((track) => {
            const entry = trackRatingsByTrack.get(track.id);
            return (
              <TrackRow
                key={track.id}
                track={track}
                albumId={album.id}
                initialUserRating={entry?.mine ?? null}
                avgRating={average(entry?.values ?? [])}
                ratingCount={entry?.values.length ?? 0}
                canRate={!!user}
              />
            );
          })}
          {(tracks ?? []).length === 0 && (
            <p className="py-4 text-sm text-muted">
              Aucun morceau renseigné pour cet album.
            </p>
          )}
        </div>
      </section>

      {user && (
        <section>
          <h2 className="text-lg font-semibold mb-2">Ta critique</h2>
          <AlbumRatingForm
            albumId={album.id}
            initialRating={myRating?.rating ?? null}
            initialReview={myRating?.review ?? null}
          />
        </section>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-2">
          Critiques ({otherReviews.length})
        </h2>
        <div className="flex flex-col gap-4">
          {otherReviews.map((r) => (
            <article
              key={r.id}
              className="rounded-lg border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between">
                <Link
                  href={`/profile/${r.profile.username}`}
                  className="font-medium hover:text-accent transition"
                >
                  {r.profile.display_name || r.profile.username}
                </Link>
                <StarDisplay rating={r.rating} size="text-sm" />
              </div>
              <p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap">
                {r.review}
              </p>
              <p className="mt-2 text-xs text-muted">{formatDate(r.updated_at)}</p>
            </article>
          ))}
          {otherReviews.length === 0 && (
            <p className="text-muted text-sm">Aucune critique pour l&apos;instant.</p>
          )}
        </div>
      </section>
    </div>
  );
}
