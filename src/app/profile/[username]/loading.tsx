import { SkeletonBlock, SkeletonRows } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center gap-4">
        <SkeletonBlock className="h-16 w-16 rounded-full" />
        <div className="flex flex-col gap-2">
          <SkeletonBlock className="h-6 w-40" />
          <SkeletonBlock className="h-4 w-24" />
        </div>
      </div>

      <div className="flex gap-8">
        <SkeletonBlock className="h-10 w-16" />
        <SkeletonBlock className="h-10 w-16" />
      </div>

      <div className="flex flex-col gap-3">
        <SkeletonBlock className="h-6 w-32" />
        <SkeletonBlock className="h-16 w-full rounded-lg" />
      </div>

      <div className="flex flex-col gap-3">
        <SkeletonBlock className="h-6 w-40" />
        <SkeletonRows count={4} />
      </div>
    </div>
  );
}
