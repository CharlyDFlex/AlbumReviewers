import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getRequestOrigin } from "@/lib/request-origin";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const origin = getRequestOrigin(request);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();
  const profileUrl = `${origin}/profile/${profile?.username ?? ""}`;

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const cookieStore = await cookies();
  const storedState = cookieStore.get("spotify_oauth_state")?.value;

  const bail = () => {
    const res = NextResponse.redirect(profileUrl);
    res.cookies.delete("spotify_oauth_state");
    return res;
  };

  if (!code || !state || !storedState || state !== storedState) {
    return bail();
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: "Spotify n'est pas configuré (identifiants manquants)." },
      { status: 500 },
    );
  }

  const tokenResponse = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: `${origin}/api/spotify/callback`,
    }),
  });
  if (!tokenResponse.ok) return bail();

  const tokens = (await tokenResponse.json()) as {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };

  const meResponse = await fetch("https://api.spotify.com/v1/me", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!meResponse.ok) return bail();
  const me = (await meResponse.json()) as { id: string };

  await supabase.from("spotify_connections").upsert(
    {
      user_id: user.id,
      spotify_user_id: me.id,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    },
    { onConflict: "user_id" },
  );

  const res = NextResponse.redirect(profileUrl);
  res.cookies.delete("spotify_oauth_state");
  return res;
}
