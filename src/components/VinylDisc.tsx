import Image from "next/image";
import { shouldSkipImageOptimization } from "@/lib/cover";

/**
 * A vinyl record drawn in CSS: grooves, a centre label made from the album
 * cover, and a spindle hole. The light reflection sits on its own
 * non-rotating layer, so when `spinning` is on only the record turns —
 * the highlight stays put, like on a real turntable.
 *
 * Sizing comes from the parent: give the wrapper a width/height (or use
 * `className="absolute inset-0"`).
 */
export function VinylDisc({
  coverUrl,
  title,
  spinning = false,
  sizes = "64px",
  className = "",
}: {
  coverUrl: string | null;
  title: string;
  spinning?: boolean;
  sizes?: string;
  className?: string;
}) {
  return (
    <div className={`relative aspect-square ${className}`}>
      <div className={`vinyl h-full w-full ${spinning ? "vinyl-spinning" : ""}`}>
        <div className="vinyl-label bg-accent">
          {coverUrl ? (
            <Image
              src={coverUrl}
              alt=""
              fill
              sizes={sizes}
              unoptimized={shouldSkipImageOptimization(coverUrl)}
              className="object-cover"
            />
          ) : (
            <span className="sr-only">{title}</span>
          )}
        </div>
        <div className="vinyl-hole" />
      </div>
      <div className="vinyl-sheen" />
    </div>
  );
}
