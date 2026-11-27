import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/actions/auth";
import { SearchBox } from "@/components/SearchBox";

export async function Navbar() {
  const t = await getTranslations("Nav");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let username: string | null = null;
  let isDiscjockey = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, role")
      .eq("id", user.id)
      .single();
    username = profile?.username ?? null;
    isDiscjockey = profile?.role === "discjockey";
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
        <Link href="/" className="group flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight">
          <span
            aria-hidden
            className="vinyl h-6 w-6 shrink-0 transition-transform duration-700 group-hover:rotate-180"
          >
            <span className="vinyl-label bg-accent" />
          </span>
          <span>
            Vinyl<span className="text-accent">box</span>
          </span>
        </Link>

        <nav className="hidden sm:flex items-center gap-4 text-sm text-muted">
          <Link href="/albums" className="hover:text-foreground transition">
            {t("albums")}
          </Link>
          {user && (
            <>
              <Link href="/collection" className="hover:text-foreground transition">
                {t("collection")}
              </Link>
              <Link href="/diary" className="hover:text-foreground transition">
                {t("diary")}
              </Link>
              <Link href="/watchlist" className="hover:text-foreground transition">
                {t("watchlist")}
              </Link>
            </>
          )}
          {isDiscjockey && (
            <Link href="/albums/nouveau" className="hover:text-foreground transition">
              {t("addAlbum")}
            </Link>
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
                  {t("logout")}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm text-muted hover:text-foreground transition"
              >
                {t("login")}
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-accent px-3 py-1.5 text-sm font-medium text-black hover:bg-accent-hover transition"
              >
                {t("signup")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
