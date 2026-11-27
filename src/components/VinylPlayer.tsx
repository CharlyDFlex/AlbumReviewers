"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { VinylDisc } from "@/components/VinylDisc";
import { StreamingLinks } from "@/components/StreamingLinks";
import { shouldSkipImageOptimization } from "@/lib/cover";
import { formatDuration, formatYear } from "@/lib/format";
import type { Track } from "@/lib/supabase/types";

export type PlayerAlbum = {
  id: string;
  title: string;
  artistName: string;
  coverUrl: string | null;
  releaseDate: string | null;
};

type PlayerTrack = Pick<Track, "id" | "track_number" | "title" | "duration_seconds">;

/**
 * Animation phases, in order:
 *   closed  → sleeve shut, record inside
 *   open    → front cover swings open on its left edge (gatefold)
 *   out     → record slides out of the sleeve, tonearm appears
 *   playing → tonearm drops onto the record, record spins
 * Closing plays the same phases backwards before unmounting.
 */
type Phase = "closed" | "open" | "out" | "playing";

const OPEN_STEPS: [Phase, number][] = [
  ["open", 60],
  ["out", 800],
  ["playing", 1650],
];
const CLOSE_STEPS: [Phase, number][] = [
  ["out", 0],
  ["open", 450],
  ["closed", 1150],
];
const CLOSE_DONE_MS = 1900;

function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

export function VinylPlayer({
  album,
  tracks: initialTracks,
  onClose,
}: {
  album: PlayerAlbum;
  /** Pass tracks when the page already has them; otherwise they're fetched. */
  tracks?: PlayerTrack[];
  onClose: () => void;
}) {
  const t = useTranslations("Player");
  const [phase, setPhase] = useState<Phase>("closed");
  const [closing, setClosing] = useState(false);
  const [fetchedTracks, setFetchedTracks] = useState<PlayerTrack[] | null>(null);
  const tracks = initialTracks ?? fetchedTracks;
  const timers = useRef<number[]>([]);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  const runSteps = useCallback((steps: [Phase, number][]) => {
    clearTimers();
    for (const [next, delay] of steps) {
      timers.current.push(window.setTimeout(() => setPhase(next), delay));
    }
  }, []);

  // Opening sequence
  useEffect(() => {
    if (prefersReducedMotion()) {
      const id = window.setTimeout(() => setPhase("playing"), 0);
      timers.current.push(id);
    } else {
      runSteps(OPEN_STEPS);
    }
    return clearTimers;
  }, [runSteps]);

  const close = useCallback(() => {
    // Second request while already closing (impatient Esc) → close now.
    if (closing || prefersReducedMotion()) {
      clearTimers();
      onClose();
      return;
    }
    setClosing(true);
    runSteps(CLOSE_STEPS);
    timers.current.push(window.setTimeout(onClose, CLOSE_DONE_MS));
  }, [closing, onClose, runSteps]);

  // Esc to close, lock page scroll, move focus into the dialog and give it
  // back to whatever opened it afterwards.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [close]);

  // Fetch the tracklist if the caller didn't hand it over.
  useEffect(() => {
    if (initialTracks) return;
    let cancelled = false;
    createClient()
      .from("tracks")
      .select("id, track_number, title, duration_seconds")
      .eq("album_id", album.id)
      .order("track_number")
      .then(
        ({ data }) => {
          if (!cancelled) setFetchedTracks(data ?? []);
        },
        () => {
          if (!cancelled) setFetchedTracks([]);
        },
      );
    return () => {
      cancelled = true;
    };
  }, [album.id, initialTracks]);

  // Split the tracklist into two sides, like the back of a real LP.
  const half = tracks ? Math.ceil(tracks.length / 2) : 0;
  const sides =
    tracks && tracks.length > 0
      ? [
          { label: t("sideA"), tracks: tracks.slice(0, half) },
          { label: t("sideB"), tracks: tracks.slice(half) },
        ].filter((side) => side.tracks.length > 0)
      : [];
  const year = formatYear(album.releaseDate);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("dialogLabel", { title: album.title, artist: album.artistName })}
      className={`player-backdrop fixed inset-0 z-50 overflow-y-auto bg-black/85 backdrop-blur-sm transition-opacity duration-500 ${
        closing && phase === "closed" ? "opacity-0" : "opacity-100"
      }`}
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="mx-auto flex min-h-full max-w-4xl flex-col items-center justify-center gap-6 px-4 py-10"
        onClick={(e) => {
          if (e.target === e.currentTarget) close();
        }}
      >
        <button
          ref={closeButtonRef}
          type="button"
          onClick={close}
          className="self-end rounded-full border border-border px-3 py-1 text-xs text-muted hover:border-accent hover:text-foreground transition cursor-pointer"
        >
          {t("putBack")} ✕
        </button>

        {/* Stage --------------------------------------------------- */}
        <div className={`player-stage phase-${phase}`}>
          <div className="player-record">
            <div className="player-sleeve-inside" />

            <div className="player-disc">
              <VinylDisc
                coverUrl={album.coverUrl}
                title={album.title}
                spinning={phase === "playing"}
                sizes="120px"
                className="h-full w-full"
              />
            </div>

            <div className="player-cover">
              <div className="player-cover-face sleeve-texture bg-surface">
                {album.coverUrl ? (
                  <Image
                    src={album.coverUrl}
                    alt={album.title}
                    fill
                    sizes="240px"
                    unoptimized={shouldSkipImageOptimization(album.coverUrl)}
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-sleeve-paper px-4 text-center font-semibold text-[#2a1e14]">
                    {album.title}
                  </div>
                )}
              </div>
              {/* Inside of the gatefold */}
              <div className="player-cover-face player-cover-back flex flex-col justify-between p-[8%]">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.25em] opacity-60">
                    {t("linerNotes")}
                  </p>
                  <p className="mt-2 line-clamp-3 text-base font-bold leading-tight sm:text-lg">
                    {album.title}
                  </p>
                  <p className="mt-1 line-clamp-2 text-xs opacity-80 sm:text-sm">
                    {album.artistName}
                  </p>
                </div>
                <div className="flex items-end justify-between text-[10px] uppercase tracking-widest opacity-60">
                  <span>{year}</span>
                  <span>33⅓ RPM</span>
                </div>
              </div>
            </div>
          </div>

          <div className="player-tonearm-base" />
          <div className="player-tonearm">
            <div className="h-full w-full rounded-full bg-gradient-to-r from-[#8c7a60] via-[#e6d6b8] to-[#8c7a60] shadow-[2px_4px_8px_rgba(0,0,0,0.6)]" />
            <div className="absolute -bottom-[6%] left-1/2 h-[12%] w-[260%] -translate-x-1/2 rounded-sm bg-[#2b2420] shadow-md" />
          </div>
        </div>

        {/* Info ---------------------------------------------------- */}
        <div
          className={`w-full max-w-2xl transition-all duration-700 ${
            phase === "playing" && !closing
              ? "translate-y-0 opacity-100"
              : "translate-y-3 opacity-0"
          }`}
        >
          <div className="text-center">
            <p className="text-xs uppercase tracking-[0.3em] text-accent">
              {t("nowSpinning")}
            </p>
            <h2 className="mt-1 text-2xl font-bold">{album.title}</h2>
            <p className="text-muted">
              {album.artistName}
              {year ? ` · ${year}` : ""}
            </p>
          </div>

          <div className="mt-4 flex flex-col items-center gap-2">
            <p className="text-xs text-muted">{t("listenOn")}</p>
            <StreamingLinks artist={album.artistName} title={album.title} />
          </div>

          <div className="mt-6 rounded-lg border border-border bg-surface/80 p-4">
            {tracks === null ? (
              <p className="text-sm text-muted">{t("loadingTracks")}</p>
            ) : sides.length === 0 ? (
              <p className="text-sm text-muted">{t("noTracks")}</p>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2">
                {sides.map((side) => (
                  <div key={side.label}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-accent">
                      {side.label}
                    </p>
                    <ol className="flex flex-col gap-1 text-sm">
                      {side.tracks.map((track) => (
                        <li key={track.id} className="flex gap-3">
                          <span className="w-5 shrink-0 text-right tabular-nums text-muted">
                            {track.track_number}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{track.title}</span>
                          <span className="shrink-0 tabular-nums text-muted">
                            {formatDuration(track.duration_seconds)}
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 text-center">
            <Link
              href={`/albums/${album.id}`}
              className="text-sm text-accent hover:underline"
            >
              {t("viewAlbum")} →
            </Link>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
