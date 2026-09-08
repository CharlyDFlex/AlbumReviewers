"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SubmitButton } from "@/components/SubmitButton";
import { addPlaylist } from "@/app/profile/[username]/actions";

const PLATFORM_PLACEHOLDERS: Record<string, string> = {
  spotify: "https://open.spotify.com/playlist/...",
  deezer: "https://www.deezer.com/playlist/...",
  itunes: "https://music.apple.com/.../playlist/...",
};

export function PlaylistForm() {
  const t = useTranslations("PlaylistForm");
  const [platform, setPlatform] = useState("spotify");

  return (
    <form
      action={addPlaylist}
      className="mt-2 flex flex-col gap-2 rounded-lg border border-border bg-surface p-4 sm:flex-row sm:items-center"
    >
      <select
        name="platform"
        value={platform}
        onChange={(e) => setPlatform(e.target.value)}
        className="rounded-full border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:border-accent cursor-pointer"
      >
        <option value="spotify">Spotify</option>
        <option value="deezer">Deezer</option>
        <option value="itunes">Apple Music</option>
      </select>
      <input
        type="url"
        name="url"
        required
        placeholder={PLATFORM_PLACEHOLDERS[platform]}
        className="min-w-0 flex-1 rounded-full border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
      />
      <input
        type="text"
        name="title"
        maxLength={100}
        placeholder={t("titlePlaceholder")}
        className="w-full rounded-full border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:border-accent sm:w-40"
      />
      <SubmitButton
        pendingText={t("adding")}
        className="shrink-0 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-black hover:bg-accent-hover transition cursor-pointer disabled:opacity-60"
      >
        {t("add")}
      </SubmitButton>
    </form>
  );
}
