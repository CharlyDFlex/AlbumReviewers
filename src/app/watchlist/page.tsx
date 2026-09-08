import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AlbumCard } from "@/components/AlbumCard";

export default async function WatchlistPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: entries } = await supabase
    .from("watchlist")
    .select("*, album:albums(*, artist:artists(*))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Albums à écouter</h1>
      <div className="flex flex-wrap gap-4">
        {entries?.map((entry) => (
          <AlbumCard key={entry.id} album={entry.album} />
        ))}
        {entries?.length === 0 && (
          <p className="text-muted text-sm">
            Ta liste est vide.{" "}
            <Link href="/albums" className="text-accent hover:underline">
              Ajoute des albums
            </Link>{" "}
            que tu veux écouter.
          </p>
        )}
      </div>
    </div>
  );
}
