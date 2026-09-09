import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { TracklistFields } from "@/components/TracklistFields";
import { createAlbum } from "@/app/albums/nouveau/actions";

export default async function NewAlbumPage(props: PageProps<"/albums/nouveau">) {
  const t = await getTranslations("AddAlbum");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "discjockey") redirect("/albums");

  const { data: artists } = await supabase.from("artists").select("name").order("name");
  const params = await props.searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      {error && (
        <p className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <form action={createAlbum} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          {t("artist")}
          <input
            type="text"
            name="artistName"
            required
            list="existing-artists"
            className="rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:border-accent"
          />
          <datalist id="existing-artists">
            {artists?.map((artist) => <option key={artist.name} value={artist.name} />)}
          </datalist>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          {t("albumTitle")}
          <input
            type="text"
            name="title"
            required
            className="rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          {t("coverUrl")}
          <input
            type="url"
            name="coverUrl"
            placeholder="https://..."
            className="rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:border-accent"
          />
        </label>

        <div className="flex gap-4">
          <label className="flex flex-1 flex-col gap-1 text-sm">
            {t("releaseDate")}
            <input
              type="date"
              name="releaseDate"
              className="rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:border-accent"
            />
          </label>
          <label className="flex flex-1 flex-col gap-1 text-sm">
            {t("genre")}
            <input
              type="text"
              name="genre"
              className="rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:border-accent"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1 text-sm">
          {t("description")}
          <textarea
            name="description"
            rows={3}
            className="rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:border-accent"
          />
        </label>

        <div className="flex flex-col gap-1 text-sm">
          {t("tracklist")}
          <TracklistFields />
        </div>

        <button
          type="submit"
          className="mt-2 self-start rounded-full bg-accent px-4 py-2 font-medium text-black hover:bg-accent-hover transition cursor-pointer"
        >
          {t("submit")}
        </button>
      </form>
    </div>
  );
}
