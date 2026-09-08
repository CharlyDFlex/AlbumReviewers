import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlbumCard } from "@/components/AlbumCard";
import { average } from "@/lib/format";

export default async function ArtistPage(props: PageProps<"/artists/[id]">) {
  const { id } = await props.params;
  const supabase = await createClient();

  const [{ data: artist }, { data: albums }] = await Promise.all([
    supabase.from("artists").select("*").eq("id", id).single(),
    supabase
      .from("albums")
      .select("*, artist:artists(*)")
      .eq("artist_id", id)
      .order("release_date", { ascending: false }),
  ]);

  if (!artist) notFound();

  const albumIds = (albums ?? []).map((a) => a.id);
  const { data: ratings } =
    albumIds.length > 0
      ? await supabase
          .from("album_ratings")
          .select("album_id, rating")
          .in("album_id", albumIds)
      : { data: [] as { album_id: string; rating: number | null }[] };

  const avgByAlbum = new Map<string, number | null>();
  for (const albumId of albumIds) {
    const values = (ratings ?? [])
      .filter((r) => r.album_id === albumId && r.rating != null)
      .map((r) => r.rating as number);
    avgByAlbum.set(albumId, average(values));
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{artist.name}</h1>
      <div className="flex flex-wrap gap-4">
        {albums?.map((album) => (
          <AlbumCard key={album.id} album={album} avgRating={avgByAlbum.get(album.id)} />
        ))}
        {albums?.length === 0 && (
          <p className="text-muted text-sm">Aucun album pour cet artiste.</p>
        )}
      </div>
    </div>
  );
}
