"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlbumSleeve } from "@/components/AlbumSleeve";
import { PlayRecordButton } from "@/components/PlayRecordButton";
import { StarDisplay } from "@/components/StarDisplay";
import { formatYear } from "@/lib/format";

export type CollectionItem = {
  id: string;
  title: string;
  coverUrl: string | null;
  releaseDate: string | null;
  genre: string | null;
  artistName: string;
  lastPlayedAt: string;
  plays: number;
  rating: number | null;
};

type Sort = "recent" | "title" | "artist" | "plays";

const collator = new Intl.Collator(undefined, { sensitivity: "base" });

export function CollectionShelf({ items }: { items: CollectionItem[] }) {
  const t = useTranslations("Collection");
  const [sort, setSort] = useState<Sort>("recent");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q
      ? items.filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.artistName.toLowerCase().includes(q) ||
            item.genre?.toLowerCase().includes(q),
        )
      : items;
    const sorted = [...filtered];
    switch (sort) {
      case "title":
        sorted.sort((a, b) => collator.compare(a.title, b.title));
        break;
      case "artist":
        sorted.sort(
          (a, b) =>
            collator.compare(a.artistName, b.artistName) ||
            (a.releaseDate ?? "").localeCompare(b.releaseDate ?? ""),
        );
        break;
      case "plays":
        sorted.sort((a, b) => b.plays - a.plays || b.lastPlayedAt.localeCompare(a.lastPlayedAt));
        break;
      default:
        // already newest-first from the server
        break;
    }
    return sorted;
  }, [items, query, sort]);

  const SORTS: Sort[] = ["recent", "title", "artist", "plays"];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("filterPlaceholder")}
          className="w-full rounded-full border border-border bg-surface px-4 py-1.5 text-sm placeholder:text-muted focus:border-accent focus:outline-none sm:w-64"
        />
        <div className="flex flex-wrap gap-1" role="group" aria-label={t("sortBy")}>
          {SORTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setSort(value)}
              aria-pressed={sort === value}
              className={`rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer ${
                sort === value
                  ? "bg-accent text-black"
                  : "border border-border text-muted hover:text-foreground"
              }`}
            >
              {t(`sort.${value}`)}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-muted">{t("noMatch")}</p>
      ) : (
        // No horizontal gap: each cell carries its own slice of plank, so
        // side by side they read as one continuous shelf.
        <ul className="grid grid-cols-2 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {visible.map((item) => (
            <li key={item.id} className="relative flex flex-col hover:z-10 focus-within:z-10">
              <div className="px-3 sm:px-4">
                <PlayRecordButton
                  album={item}
                  label={t("play", { title: item.title, artist: item.artistName })}
                  className="block w-full pr-3"
                >
                  <div className="relative">
                    <AlbumSleeve
                      coverUrl={item.coverUrl}
                      title={item.title}
                      sizes="(min-width: 1024px) 180px, (min-width: 640px) 200px, 45vw"
                    />
                    {item.plays > 1 && (
                      <span className="absolute -top-2 -left-2 z-10 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-black shadow">
                        ×{item.plays}
                      </span>
                    )}
                    <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                      <span className="rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
                        ▶ {t("playShort")}
                      </span>
                    </span>
                  </div>
                </PlayRecordButton>
              </div>
              <div className="shelf-plank mt-1" />
              <div className="mt-2 min-w-0 px-3 sm:px-4">
                <p className="truncate text-sm font-medium">{item.title}</p>
                <p className="truncate text-xs text-muted">
                  {item.artistName}
                  {item.releaseDate ? ` · ${formatYear(item.releaseDate)}` : ""}
                </p>
                <div className="mt-1">
                  <StarDisplay rating={item.rating} size="text-xs" />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
