"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

const SORT_VALUES = ["title", "popular", "recent", "newest"] as const;

export function AlbumFilters({
  genres,
  years,
}: {
  genres: string[];
  years: number[];
}) {
  const t = useTranslations("AlbumFilters");
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    router.push(`/albums?${params.toString()}`);
  }

  const selectClass =
    "rounded-full border border-border bg-surface px-3 py-1.5 text-sm focus:outline-none focus:border-accent cursor-pointer";

  const sortLabels: Record<(typeof SORT_VALUES)[number], string> = {
    title: t("sortTitle"),
    popular: t("sortPopular"),
    recent: t("sortRecent"),
    newest: t("sortNewest"),
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={searchParams.get("genre") ?? ""}
        onChange={(e) => updateParam("genre", e.target.value)}
        className={selectClass}
        aria-label={t("filterByGenre")}
      >
        <option value="">{t("allGenres")}</option>
        {genres.map((g) => (
          <option key={g} value={g}>
            {g}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("year") ?? ""}
        onChange={(e) => updateParam("year", e.target.value)}
        className={selectClass}
        aria-label={t("filterByYear")}
      >
        <option value="">{t("allYears")}</option>
        {years.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>

      <select
        value={searchParams.get("sort") ?? "title"}
        onChange={(e) => updateParam("sort", e.target.value)}
        className={selectClass}
        aria-label={t("sortBy")}
      >
        {SORT_VALUES.map((value) => (
          <option key={value} value={value}>
            {sortLabels[value]}
          </option>
        ))}
      </select>

      {(searchParams.get("genre") || searchParams.get("year")) && (
        <button
          type="button"
          onClick={() => router.push("/albums")}
          className="text-sm text-muted hover:text-danger transition cursor-pointer"
        >
          {t("reset")}
        </button>
      )}
    </div>
  );
}
