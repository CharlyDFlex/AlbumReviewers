"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseDurationToSeconds } from "@/lib/format";

function fail(message: string): never {
  redirect(`/albums/nouveau?error=${encodeURIComponent(message)}`);
}

export async function createAlbum(formData: FormData) {
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

  const artistName = String(formData.get("artistName") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const coverUrl = String(formData.get("coverUrl") ?? "").trim();
  const releaseDate = String(formData.get("releaseDate") ?? "").trim();
  const genre = String(formData.get("genre") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const trackTitles = formData.getAll("trackTitle").map(String);
  const trackDurations = formData.getAll("trackDuration").map(String);

  if (!artistName || !title) {
    fail("L'artiste et le titre de l'album sont obligatoires.");
  }

  const { data: existingArtist } = await supabase
    .from("artists")
    .select("id")
    .ilike("name", artistName)
    .maybeSingle();

  let artistId = existingArtist?.id;
  if (!artistId) {
    const { data: newArtist, error: artistError } = await supabase
      .from("artists")
      .insert({ name: artistName })
      .select("id")
      .single();
    if (artistError || !newArtist) fail("Impossible de créer l'artiste.");
    artistId = newArtist.id;
  }

  const { data: album, error: albumError } = await supabase
    .from("albums")
    .insert({
      artist_id: artistId,
      title,
      cover_url: coverUrl || null,
      release_date: releaseDate || null,
      genre: genre || null,
      description: description || null,
    })
    .select("id")
    .single();
  if (albumError || !album) fail("Impossible de créer l'album.");

  const tracks = trackTitles
    .map((trackTitle, index) => ({
      album_id: album.id,
      track_number: index + 1,
      title: trackTitle.trim(),
      duration_seconds: parseDurationToSeconds(trackDurations[index] ?? ""),
    }))
    .filter((track) => track.title.length > 0);

  if (tracks.length > 0) {
    const { error: tracksError } = await supabase.from("tracks").insert(tracks);
    if (tracksError) fail("L'album a été créé mais la tracklist n'a pas pu être enregistrée.");
  }

  redirect(`/albums/${album.id}`);
}
