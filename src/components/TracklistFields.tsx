"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";

let nextRowId = 0;

export function TracklistFields() {
  const t = useTranslations("AddAlbum");
  const [rowIds, setRowIds] = useState<number[]>(() => [nextRowId++, nextRowId++, nextRowId++]);
  const listId = useId();

  return (
    <div className="flex flex-col gap-2">
      {rowIds.map((rowId, index) => (
        <div key={rowId} className="flex items-center gap-2">
          <span className="w-5 shrink-0 text-right text-xs text-muted">{index + 1}</span>
          <input
            type="text"
            name="trackTitle"
            placeholder={t("trackTitlePlaceholder")}
            className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
          />
          <input
            type="text"
            name="trackDuration"
            placeholder="3:45"
            pattern="^\d+:[0-5]\d$|^\d+$"
            title={t("trackDurationHint")}
            aria-describedby={listId}
            className="w-20 shrink-0 rounded-md border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={() => setRowIds((rows) => rows.filter((id) => id !== rowId))}
            className="shrink-0 text-xs text-muted hover:text-danger cursor-pointer"
          >
            {t("removeTrack")}
          </button>
        </div>
      ))}
      <p id={listId} className="sr-only">
        {t("trackDurationHint")}
      </p>
      <button
        type="button"
        onClick={() => setRowIds((rows) => [...rows, nextRowId++])}
        className="self-start rounded-full border border-border px-3 py-1 text-xs font-medium hover:bg-surface-hover transition cursor-pointer"
      >
        {t("addTrack")}
      </button>
    </div>
  );
}
