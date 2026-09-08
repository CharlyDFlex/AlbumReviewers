import Link from "next/link";
import { signIn } from "@/lib/actions/auth";

export default async function LoginPage(props: PageProps<"/login">) {
  const params = await props.searchParams;
  const error = typeof params.error === "string" ? params.error : null;
  const message = typeof params.message === "string" ? params.message : null;

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold mb-6">Connexion</h1>

      {message && (
        <p className="mb-4 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent">
          {message}
        </p>
      )}
      {error && (
        <p className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <form action={signIn} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            name="email"
            required
            className="rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Mot de passe
          <input
            type="password"
            name="password"
            required
            className="rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-full bg-accent px-4 py-2 font-medium text-black hover:bg-accent-hover transition cursor-pointer"
        >
          Se connecter
        </button>
      </form>

      <p className="mt-4 text-sm text-muted">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="text-accent hover:underline">
          Inscris-toi
        </Link>
      </p>
    </div>
  );
}
