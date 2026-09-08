"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

function parseRating(raw: FormDataEntryValue | null): number | null {
  if (raw == null || raw === "") return null;
  const value = Number(raw);
  if (Number.isNaN(value) || value < 0.5 || value > 5) return null;
  return Math.round(value * 2) / 2;
}

export async function rateAlbum(formData: FormData) {
  const { supabase, user } = await requireUser();
  const albumId = String(formData.get("albumId"));
  const rating = parseRating(formData.get("rating"));
  const reviewRaw = String(formData.get("review") ?? "").trim();
  const review = reviewRaw.length > 0 ? reviewRaw : null;

  await supabase
    .from("album_ratings")
    .upsert(
      { user_id: user.id, album_id: albumId, rating, review },
      { onConflict: "user_id,album_id" },
    );

  revalidatePath(`/albums/${albumId}`);
  revalidatePath("/");
  revalidatePath("/profile", "layout");
}

export async function rateTrack(formData: FormData) {
  const { supabase, user } = await requireUser();
  const trackId = String(formData.get("trackId"));
  const albumId = String(formData.get("albumId"));
  const rating = parseRating(formData.get("rating"));

  if (rating == null) {
    await supabase
      .from("track_ratings")
      .delete()
      .eq("user_id", user.id)
      .eq("track_id", trackId);
  } else {
    await supabase
      .from("track_ratings")
      .upsert(
        { user_id: user.id, track_id: trackId, rating },
        { onConflict: "user_id,track_id" },
      );
  }

  revalidatePath(`/albums/${albumId}`);
}

export async function logListen(formData: FormData) {
  const { supabase, user } = await requireUser();
  const albumId = String(formData.get("albumId"));

  await supabase.from("listens").insert({ user_id: user.id, album_id: albumId });
  await supabase
    .from("watchlist")
    .delete()
    .eq("user_id", user.id)
    .eq("album_id", albumId);

  revalidatePath(`/albums/${albumId}`);
  revalidatePath("/diary");
  revalidatePath("/watchlist");
  revalidatePath("/");
}

export async function deleteListen(formData: FormData) {
  const { supabase, user } = await requireUser();
  const listenId = String(formData.get("listenId"));
  const albumId = String(formData.get("albumId"));

  await supabase.from("listens").delete().eq("id", listenId).eq("user_id", user.id);

  revalidatePath(`/albums/${albumId}`);
  revalidatePath("/diary");
}

export async function toggleWatchlist(formData: FormData) {
  const { supabase, user } = await requireUser();
  const albumId = String(formData.get("albumId"));
  const isOnWatchlist = String(formData.get("isOnWatchlist")) === "true";

  if (isOnWatchlist) {
    await supabase
      .from("watchlist")
      .delete()
      .eq("user_id", user.id)
      .eq("album_id", albumId);
  } else {
    await supabase
      .from("watchlist")
      .upsert(
        { user_id: user.id, album_id: albumId },
        { onConflict: "user_id,album_id" },
      );
  }

  revalidatePath(`/albums/${albumId}`);
  revalidatePath("/watchlist");
  revalidatePath("/");
}
