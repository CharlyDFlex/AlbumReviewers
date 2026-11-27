import Image from "next/image";
import { VinylDisc } from "@/components/VinylDisc";
import { shouldSkipImageOptimization } from "@/lib/cover";

/**
 * The visual half of an album card: a square sleeve with the record tucked
 * behind it. On hover/focus of the nearest `.group` ancestor the record
 * slides out to the right (see `.sleeve-disc` / `.sleeve-cover` in
 * globals.css). Purely presentational — wrap it in a Link or a button.
 */
export function AlbumSleeve({
  coverUrl,
  title,
  sizes = "160px",
  priority = false,
}: {
  coverUrl: string | null;
  title: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <div className="relative aspect-square w-full">
      <div className="sleeve-disc absolute inset-[3%]">
        <VinylDisc coverUrl={coverUrl} title={title} sizes="64px" className="h-full w-full" />
      </div>
      <div className="sleeve-cover sleeve-texture absolute inset-0 overflow-hidden rounded-[3px] bg-surface border border-black/40 shadow-[2px_4px_12px_rgba(0,0,0,0.5)] flex items-center justify-center">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={title}
            fill
            sizes={sizes}
            priority={priority}
            unoptimized={shouldSkipImageOptimization(coverUrl)}
            className="object-cover"
          />
        ) : (
          <span className="bg-sleeve-paper text-[#2a1e14] absolute inset-0 flex items-center justify-center px-2 text-center text-xs font-semibold">
            {title}
          </span>
        )}
      </div>
    </div>
  );
}
