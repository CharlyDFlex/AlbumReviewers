import { SkeletonAlbumRow, SkeletonBlock } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <div className="flex items-baseline justify-between mb-4">
          <SkeletonBlock className="h-6 w-48" />
          <SkeletonBlock className="h-4 w-16" />
        </div>
        <SkeletonAlbumRow />
      </section>

      <section>
        <div className="flex items-baseline justify-between mb-4">
          <SkeletonBlock className="h-6 w-40" />
          <SkeletonBlock className="h-4 w-16" />
        </div>
        <SkeletonAlbumRow />
      </section>
    </div>
  );
}
