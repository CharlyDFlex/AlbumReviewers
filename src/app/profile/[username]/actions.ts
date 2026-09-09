"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getValidSpotifyAccessToken } from "@/lib/spotify";
import { getDiscjockeyEligibility } from "@/lib/discjockey";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

// Domains a given platform's playlist URL must belong to — rejects
// mislabeled or unrelated links (and anything non-https) server-side,
// since the <select> only constrains the client.
const PLATFORM_HOSTS: Record<string, string[]> = {
  spotify: ["open.spotify.com"],
  deezer: ["www.deezer.com", "deezer.com"],
  itunes: ["music.apple.com", "itunes.apple.com"],
};

export async function addPlaylist(formData: FormData) {
  const { supabase, user } = await requireUser();
  const platform = String(formData.get("platform") ?? "");
  const urlRaw = String(formData.get("url") ?? "").trim();
  const titleRaw = String(formData.get("title") ?? "").trim();

  const allowedHosts = PLATFORM_HOSTS[platform];
  if (!allowedHosts) return;

  let parsed: URL;
  try {
    parsed = new URL(urlRaw);
  } catch {
    return;
  }
  if (parsed.protocol !== "https:" || !allowedHosts.includes(parsed.hostname)) return;

  await supabase.from("playlists").insert({
    user_id: user.id,
    platform: platform as "spotify" | "deezer" | "itunes",
    url: parsed.toString(),
    title: titleRaw.length > 0 ? titleRaw.slice(0, 100) : null,
  });

  revalidatePath("/profile", "layout");
}

export async function deletePlaylist(formData: FormData) {
  const { supabase, user } = await requireUser();
  const playlistId = String(formData.get("playlistId"));

  await supabase.from("playlists").delete().eq("id", playlistId).eq("user_id", user.id);

  revalidatePath("/profile", "layout");
}

type SpotifyPlaylist = {
  id: string;
  name: string;
  external_urls: { spotify: string };
};

export async function importSpotifyPlaylists() {
  const { supabase, user } = await requireUser();
  const accessToken = await getValidSpotifyAccessToken(user.id);
  if (!accessToken) return;

  const items: SpotifyPlaylist[] = [];
  let nextUrl: string | null =
    "https://api.spotify.com/v1/me/playlists?limit=50";

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) break;
    const page = (await response.json()) as {
      items: SpotifyPlaylist[];
      next: string | null;
    };
    items.push(...page.items);
    nextUrl = page.next;
  }

  if (items.length > 0) {
    await supabase.from("playlists").upsert(
      items.map((playlist) => ({
        user_id: user.id,
        platform: "spotify" as const,
        url: playlist.external_urls.spotify,
        title: playlist.name,
        external_id: playlist.id,
      })),
      { onConflict: "user_id,platform,external_id" },
    );
  }

  revalidatePath("/profile", "layout");
}

export async function disconnectSpotify() {
  const { supabase, user } = await requireUser();
  await supabase.from("spotify_connections").delete().eq("user_id", user.id);
  revalidatePath("/profile", "layout");
}

export async function requestDiscjockey(formData: FormData) {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, created_at")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role === "discjockey") return;

  const eligibility = await getDiscjockeyEligibility(supabase, user.id, profile.created_at);
  if (!eligibility.eligible) return;

  const message = String(formData.get("message") ?? "").trim();

  // A unique partial index (one pending request per user) backs this up —
  // a duplicate insert just fails silently, which is fine here since the
  // button is already hidden once a pending request exists.
  await supabase.from("discjockey_requests").insert({
    user_id: user.id,
    message: message.length > 0 ? message.slice(0, 500) : null,
  });

  revalidatePath("/profile", "layout");
}
