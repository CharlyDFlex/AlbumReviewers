import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StarDisplay } from "@/components/StarDisplay";
import { formatDate } from "@/lib/format";

export default async function ProfilePage(props: PageProps<"/profile/[username]">) {
  const { username } = await props.params;
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) notFound();

  const [{ data: listens, count: listenCount }, { data: reviews, count: ratingCount }] =
    await Promise.all([
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
    ]);

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
          <p className="text-muted">écoutes</p>
        </div>
        <div>
          <span className="text-xl font-bold">{ratingCount ?? 0}</span>
          <p className="text-muted">notes</p>
        </div>
      </div>

      <section>
        <h2 className="text-lg font-semibold mb-3">Critiques récentes</h2>
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
                <p className="mt-2 text-xs text-muted">{formatDate(r.updated_at)}</p>
              </article>
            ))}
          {reviews?.filter((r) => r.review).length === 0 && (
            <p className="text-muted text-sm">Aucune critique pour l&apos;instant.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Journal récent</h2>
        <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
          {listens?.map((listen) => (
            <Link
              key={listen.id}
              href={`/albums/${listen.album.id}`}
              className="flex items-center gap-4 p-3 hover:bg-surface-hover transition"
            >
              {listen.album.cover_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={listen.album.cover_url}
                  alt={listen.album.title}
                  className="h-12 w-12 rounded object-cover border border-border shrink-0"
                />
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
                {formatDate(listen.listened_at)}
              </p>
            </Link>
          ))}
          {listens?.length === 0 && (
            <p className="p-4 text-sm text-muted">Aucune écoute pour l&apos;instant.</p>
          )}
        </div>
      </section>
    </div>
  );
}
