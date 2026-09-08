import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { SearchBox } from "@/components/SearchBox";

export async function Navbar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? null;
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight">
          Vinyl<span className="text-accent">box</span>
        </Link>

        <nav className="hidden sm:flex items-center gap-4 text-sm text-muted">
          <Link href="/albums" className="hover:text-foreground transition">
            Albums
          </Link>
          {user && (
            <>
              <Link href="/diary" className="hover:text-foreground transition">
                Journal
              </Link>
              <Link href="/watchlist" className="hover:text-foreground transition">
                À écouter
              </Link>
            </>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <SearchBox />
          {user && username ? (
            <>
              <Link
                href={`/profile/${username}`}
                className="text-sm font-medium hover:text-accent transition"
              >
                {username}
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="text-sm text-muted hover:text-danger transition cursor-pointer"
                >
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted hover:text-foreground transition"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-black hover:bg-accent-hover transition"
              >
                S&apos;inscrire
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
