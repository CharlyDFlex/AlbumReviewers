import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { StarDisplay } from "@/components/StarDisplay";
import { formatDate } from "@/lib/format";

export default async function DiaryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: listens } = await supabase
    .from("listens")
    .select("*, album:albums(*, artist:artists(*))")
    .eq("user_id", user.id)
    .order("listened_at", { ascending: false })
    .order("created_at", { ascending: false });

  const { data: ratings } = await supabase
    .from("album_ratings")
    .select("album_id, rating")
    .eq("user_id", user.id);
  const ratingByAlbum = new Map((ratings ?? []).map((r) => [r.album_id, r.rating]));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Ton journal d&apos;écoute</h1>
      <div className="flex flex-col divide-y divide-border rounded-lg border border-border bg-surface">
        {listens?.map((listen) => (
          <Link
            key={listen.id}
            href={`/albums/${listen.album.id}`}
            className="flex items-center gap-4 p-4 hover:bg-surface-hover transition"
          >
            {listen.album.cover_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={listen.album.cover_url}
                alt={listen.album.title}
                className="h-14 w-14 rounded object-cover border border-border shrink-0"
              />
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
                {formatDate(listen.listened_at)}
              </p>
            </div>
          </Link>
        ))}
        {listens?.length === 0 && (
          <p className="p-4 text-sm text-muted">
            Aucune écoute enregistrée pour l&apos;instant.{" "}
            <Link href="/albums" className="text-accent hover:underline">
              Parcours les albums
            </Link>{" "}
            pour commencer.
          </p>
        )}
      </div>
    </div>
  );
}
