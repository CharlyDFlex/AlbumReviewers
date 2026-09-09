import { createClient } from "@/lib/supabase/server";
import { decryptToken, encryptToken } from "@/lib/token-crypto";

function basicAuthHeader() {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;
  return `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`;
}

async function refreshAccessToken(refreshToken: string) {
  const auth = basicAuthHeader();
  if (!auth) return null;

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: auth,
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!response.ok) return null;

  return (await response.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };
}

// Returns a usable Spotify access token for this user, refreshing it first
// if it's expired (or close to it). Returns null if they haven't connected
// Spotify, or the refresh failed (token revoked from Spotify's side).
export async function getValidSpotifyAccessToken(userId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: connection } = await supabase
    .from("spotify_connections")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!connection) return null;

  const stillValid = new Date(connection.expires_at).getTime() > Date.now() + 60_000;
  if (stillValid) return decryptToken(connection.access_token);

  const refreshed = await refreshAccessToken(decryptToken(connection.refresh_token));
  if (!refreshed) return null;

  await supabase
    .from("spotify_connections")
    .update({
      access_token: encryptToken(refreshed.access_token),
      expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
      // Spotify doesn't always rotate the refresh token — keep the old one
      // unless a new one comes back.
      ...(refreshed.refresh_token ? { refresh_token: encryptToken(refreshed.refresh_token) } : {}),
    })
    .eq("user_id", userId);

  return refreshed.access_token;
}
