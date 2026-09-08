import { SkeletonAlbumGrid, SkeletonBlock } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      <SkeletonBlock className="h-9 w-64 mb-6" />
      <SkeletonAlbumGrid />
    </div>
  );
}
