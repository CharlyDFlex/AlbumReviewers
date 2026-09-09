import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { signUp } from "@/lib/actions/auth";

export default async function SignupPage(props: PageProps<"/signup">) {
  const t = await getTranslations("Signup");
  const params = await props.searchParams;
  const error = typeof params.error === "string" ? params.error : null;

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-bold mb-6">{t("title")}</h1>

      {error && (
        <p className="mb-4 rounded-md border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <form action={signUp} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          {t("username")}
          <input
            type="text"
            name="username"
            required
            minLength={2}
            className="rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("email")}
          <input
            type="email"
            name="email"
            required
            className="rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:border-accent"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("password")}
          <input
            type="password"
            name="password"
            required
            minLength={6}
            className="rounded-md border border-border bg-surface px-3 py-2 focus:outline-none focus:border-accent"
          />
        </label>
        <button
          type="submit"
          className="mt-2 rounded-full bg-accent px-4 py-2 font-medium text-black hover:bg-accent-hover transition cursor-pointer"
        >
          {t("submit")}
        </button>
        <p className="text-xs text-muted">
          {t.rich("acceptTerms", {
            cgu: (chunks) => (
              <Link href="/cgu" className="text-accent hover:underline">
                {chunks}
              </Link>
            ),
            privacy: (chunks) => (
              <Link href="/confidentialite" className="text-accent hover:underline">
                {chunks}
              </Link>
            ),
          })}
        </p>
      </form>

      <p className="mt-4 text-sm text-muted">
        {t("alreadyHaveAccount")}{" "}
        <Link href="/login" className="text-accent hover:underline">
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
