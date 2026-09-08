import { SkeletonBlock, SkeletonRows } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      <SkeletonBlock className="h-8 w-56 mb-6" />
      <SkeletonRows count={8} />
    </div>
  );
}
