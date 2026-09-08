import { SkeletonAlbumGrid, SkeletonBlock } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      <SkeletonBlock className="h-8 w-48 mb-6" />
      <SkeletonAlbumGrid />
    </div>
  );
}
