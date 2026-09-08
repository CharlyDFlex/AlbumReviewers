import { SkeletonAlbumGrid, SkeletonBlock } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <SkeletonBlock className="h-8 w-56" />
        <SkeletonBlock className="h-4 w-32" />
      </div>
      <SkeletonAlbumGrid />
    </div>
  );
}
