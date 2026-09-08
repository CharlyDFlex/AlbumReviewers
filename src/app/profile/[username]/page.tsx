import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { PlaylistForm } from "@/components/PlaylistForm";
import { StarDisplay } from "@/components/StarDisplay";
import { SubmitButton } from "@/components/SubmitButton";
import { formatDate } from "@/lib/format";
import { shouldSkipImageOptimization } from "@/lib/cover";
import { INTL_TAGS } from "@/i18n/locales";
import {
  deletePlaylist,
  disconnectSpotify,
  importSpotifyPlaylists,
} from "@/app/profile/[username]/actions";

// Proper nouns — not translated.
const PLATFORM_LABELS: Record<string, string> = {
  spotify: "Spotify",
  deezer: "Deezer",
  itunes: "Apple Music",
};

export default async function ProfilePage(props: PageProps<"/profile/[username]">) {
  const t = await getTranslations("Profile");
  const locale = await getLocale();
  const intlLocale = INTL_TAGS[locale];
  const { username } = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const isOwnProfile = user?.id === profile.id;

  const [
    { data: listens, count: listenCount },
    { data: reviews, count: ratingCount },
    { data: playlists },
    connectionResult,
  ] = await Promise.all([
    supabase
      .from("listens")
      .select("*, album:albums(*, artist:artists(*))", { count: "exact" })
      .eq("user_id", profile.id)
      .order("listened_at", { ascending: false })
      .limit(12),
    supabase
      .from("album_ratings")
      .select("*, album:albums(*, artist:artists(*))", { count: "exact" })
      .eq("user_id", profile.id)
      .order("updated_at", { ascending: false })
      .limit(10),
    supabase
      .from("playlists")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false }),
    isOwnProfile
      ? supabase
          .from("spotify_connections")
          .select("user_id")
          .eq("user_id", profile.id)
          .maybeSingle()
      : Promise.resolve({ data: null }),
  ]);
  const spotifyConnected = !!connectionResult.data;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-surface border border-border flex items-center justify-center text-xl font-bold text-muted">
          {(profile.display_name || profile.username)[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold">
            {profile.display_name || profile.username}
          </h1>
          <p className="text-sm text-muted">@{profile.username}</p>
        </div>
      </div>

      {profile.bio && <p className="text-sm text-foreground/80">{profile.bio}</p>}

      <div className="flex gap-8 text-sm">
        <div>
          <span className="text-xl font-bold">{listenCount ?? 0}</span>
          <p className="text-muted">{t("listens")}</p>
        </div>
        <div>
          <span className="text-xl font-bold">{ratingCount ?? 0}</span>
          <p className="text-muted">{t("ratings")}</p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">{t("playlists")}</h2>
        <div className="flex flex-col gap-2">
          {playlists?.map((playlist) => (
            <div
              key={playlist.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-2.5"
            >
              <span className="shrink-0 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted">
                {PLATFORM_LABELS[playlist.platform] ?? playlist.platform}
              </span>
              <a
                href={playlist.url}
                target="_blank"
                rel="noopener noreferrer"
                className="min-w-0 flex-1 truncate text-sm hover:text-accent transition"
              >
                {playlist.title || playlist.url}
              </a>
              {isOwnProfile && (
                <form action={deletePlaylist}>
                  <input type="hidden" name="playlistId" value={playlist.id} />
                  <SubmitButton
                    pendingText="..."
                    className="shrink-0 text-xs text-muted hover:text-danger cursor-pointer"
                  >
                    {t("delete")}
                  </SubmitButton>
                </form>
              )}
            </div>
          ))}
          {playlists?.length === 0 && (
            <p className="text-muted text-sm">{t("noPlaylistsYet")}</p>
          )}

          {isOwnProfile && (
            <div className="mt-2 flex flex-wrap items-center gap-3 rounded-lg border border-border bg-surface p-4">
              {spotifyConnected ? (
                <>
                  <span className="text-sm text-accent">{t("spotifyConnected")}</span>
                  <form action={importSpotifyPlaylists}>
                    <SubmitButton
                      pendingText={t("importing")}
                      className="rounded-full border border-border px-4 py-1.5 text-sm font-medium hover:bg-surface-hover transition cursor-pointer disabled:opacity-60"
                    >
                      {t("importSpotifyPlaylists")}
                    </SubmitButton>
                  </form>
                  <form action={disconnectSpotify}>
                    <SubmitButton
                      pendingText="..."
                      className="text-xs text-muted hover:text-danger cursor-pointer"
                    >
                      {t("disconnect")}
                    </SubmitButton>
                  </form>
                </>
              ) : (
                <a
                  href="/api/spotify/connect"
                  className="rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-black hover:bg-accent-hover transition"
                >
                  {t("connectSpotify")}
                </a>
              )}
            </div>
          )}

          {isOwnProfile && <PlaylistForm />}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">{t("recentReviews")}</h2>
        <div className="flex flex-col gap-4">
          {reviews
            ?.filter((r) => r.review)
            .map((r) => (
              <article
                key={r.id}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <div className="flex items-center justify-between">
                  <Link
                    href={`/albums/${r.album.id}`}
                    className="font-medium hover:text-accent transition"
                  >
                    {r.album.title} · {r.album.artist.name}
                  </Link>
                  <StarDisplay rating={r.rating} size="text-sm" />
                </div>
                <p className="mt-2 text-sm text-foreground/90 whitespace-pre-wrap">
                  {r.review}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {formatDate(r.updated_at, intlLocale)}
                </p>
              </article>
            ))}
          {reviews?.filter((r) => r.review).length === 0 && (
            <p className="text-muted text-sm">{t("noReviewsYet")}</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">{t("recentDiary")}</h2>
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
          {listens?.map((listen) => (
            <Link
              key={listen.id}
              href={`/albums/${listen.album.id}`}
              className="flex items-center gap-4 p-3 hover:bg-surface-hover transition"
            >
              {listen.album.cover_url ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-border">
                  <Image
                    src={listen.album.cover_url}
                    alt={listen.album.title}
                    fill
                    sizes="48px"
                    unoptimized={shouldSkipImageOptimization(listen.album.cover_url)}
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="h-12 w-12 rounded bg-background border border-border shrink-0" />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate text-sm">{listen.album.title}</p>
                <p className="text-xs text-muted truncate">
                  {listen.album.artist.name}
                </p>
              </div>
              <p className="text-xs text-muted shrink-0">
                {formatDate(listen.listened_at, intlLocale)}
              </p>
            </Link>
          ))}
          {listens?.length === 0 && (
            <p className="p-4 text-sm text-muted">{t("noListensYet")}</p>
          )}
        </div>
      </section>
    </div>
  );
}
