import { createClient } from "@/lib/supabase/server";
import { AlbumCard } from "@/components/AlbumCard";

export default async function AlbumsPage(props: PageProps<"/albums">) {
  const params = await props.searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  const supabase = await createClient();
  const { data: albums } = await supabase
    .from("albums")
    .select("*, artist:artists(*)")
    .order("title", { ascending: true });

  // Filtering an embedded relation (artist.name) isn't supported by
  // PostgREST's `.or()`, so match title/artist client-side instead —
  // fine at the catalog sizes this test version deals with.
  const filtered = q
    ? albums?.filter(
        (a) =>
          a.title.toLowerCase().includes(q.toLowerCase()) ||
          a.artist.name.toLowerCase().includes(q.toLowerCase()),
      )
    : albums;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">
        {q ? `Résultats pour "${q}"` : "Tous les albums"}
      </h1>
      <div className="flex flex-wrap gap-4">
        {filtered?.map((album) => (
          <AlbumCard key={album.id} album={album} />
        ))}
        {filtered?.length === 0 && (
          <p className="text-muted text-sm">Aucun album trouvé.</p>
        )}
      </div>
    </div>
  );
}
