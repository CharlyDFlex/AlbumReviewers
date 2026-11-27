"use client";

import { useState, type ReactNode } from "react";
import { VinylPlayer, type PlayerAlbum } from "@/components/VinylPlayer";
import type { Track } from "@/lib/supabase/types";

/**
 * Turns whatever it wraps (usually an AlbumSleeve) into a button that opens
 * the vinyl player for that album.
 */
export function PlayRecordButton({
  album,
  tracks,
  label,
  className = "",
  children,
}: {
  album: PlayerAlbum;
  tracks?: Pick<Track, "id" | "track_number" | "title" | "duration_seconds">[];
  /** Accessible name for the button, e.g. "Play Brat — Charli xcx". */
  label: string;
  className?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label={label}
        onClick={() => setOpen(true)}
        className={`group cursor-pointer text-left outline-none ${className}`}
      >
        {children}
      </button>
      {open && (
        <VinylPlayer album={album} tracks={tracks} onClose={() => setOpen(false)} />
      )}
    </>
  );
}
