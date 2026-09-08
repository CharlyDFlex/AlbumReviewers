"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { StarRatingInput } from "@/components/StarRatingInput";
import { StarDisplay } from "@/components/StarDisplay";
import { formatDuration } from "@/lib/format";
import { rateTrack } from "@/app/albums/[id]/actions";
import type { Track } from "@/lib/supabase/types";

export function TrackRow({
  track,
  albumId,
  initialUserRating,
  avgRating,
  ratingCount,
  canRate,
}: {
  track: Track;
  albumId: string;
  initialUserRating: number | null;
  avgRating: number | null;
  ratingCount: number;
  canRate: boolean;
}) {
  const t = useTranslations("TrackRow");
  const [rating, setRating] = useState<number | null>(initialUserRating);
  const [isPending, startTransition] = useTransition();

  function handleChange(value: number | null) {
    setRating(value);
    const formData = new FormData();
    formData.set("trackId", track.id);
    formData.set("albumId", albumId);
    formData.set("rating", value == null ? "" : String(value));
    startTransition(() => {
      rateTrack(formData);
    });
  }

  return (
    <div className="flex items-center gap-3 py-2 border-b border-border last:border-0">
      <span className="w-5 shrink-0 text-right text-xs text-muted">
        {track.track_number}
      </span>
      <span className="flex-1 min-w-0 truncate text-sm">{track.title}</span>
      <span className="shrink-0 text-xs text-muted">
        {formatDuration(track.duration_seconds)}
      </span>
      <span className="shrink-0 w-24 text-right">
        {ratingCount > 0 ? (
          <span className="inline-flex items-center gap-1">
            <StarDisplay rating={avgRating} size="text-xs" />
          </span>
        ) : (
          <span className="text-xs text-muted">—</span>
        )}
      </span>
      <span className={`shrink-0 ${isPending ? "opacity-60" : ""}`}>
        {canRate ? (
          <StarRatingInput value={rating} onChange={handleChange} size="text-sm" />
        ) : (
          <span className="text-xs text-muted">{t("loginToRate")}</span>
        )}
      </span>
    </div>
  );
}
