import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AlbumCard } from "@/components/AlbumCard";

export default async function ArtistPage(props: PageProps<"/artists/[id]">) {
  const t = await getTranslations("Artist");
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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">{artist.name}</h1>
      <div className="flex flex-wrap gap-4">
        {albums?.map((album) => (
          <AlbumCard key={album.id} album={album} avgRating={album.avg_rating} />
        ))}
        {albums?.length === 0 && (
          <p className="text-muted text-sm">{t("noAlbumsForArtist")}</p>
        )}
      </div>
    </div>
  );
}
