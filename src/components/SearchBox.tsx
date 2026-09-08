"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function SearchBox() {
  const router = useRouter();
  const t = useTranslations("SearchBox");

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = new FormData(e.currentTarget).get("q");
        router.push(`/albums?q=${encodeURIComponent(String(q ?? ""))}`);
      }}
      className="hidden md:block"
    >
      <input
        type="search"
        name="q"
        placeholder={t("placeholder")}
        className="w-56 rounded-full border border-border bg-surface px-3 py-1.5 text-sm placeholder:text-muted focus:outline-none focus:border-accent"
      />
    </form>
  );
}
