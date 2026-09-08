import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AlbumCard } from "@/components/AlbumCard";

export default async function WatchlistPage() {
  const t = await getTranslations("Watchlist");
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
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>
      <div className="flex flex-wrap gap-4">
        {entries?.map((entry) => (
          <AlbumCard key={entry.id} album={entry.album} />
        ))}
        {entries?.length === 0 && (
          <p className="text-muted text-sm">
            {t.rich("empty", {
              link: (chunks) => (
                <Link href="/albums" className="text-accent hover:underline">
                  {chunks}
                </Link>
              ),
            })}
          </p>
        )}
      </div>
    </div>
  );
}
