import { SkeletonBlock } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row gap-6">
        <SkeletonBlock className="w-48 aspect-square shrink-0 mx-auto sm:mx-0 rounded-lg" />
        <div className="flex-1 min-w-0 flex flex-col gap-3">
          <SkeletonBlock className="h-8 w-2/3" />
          <SkeletonBlock className="h-5 w-1/3" />
          <SkeletonBlock className="h-4 w-24" />
          <SkeletonBlock className="h-9 w-40 mt-2" />
        </div>
      </div>
      <SkeletonBlock className="h-48 w-full rounded-lg" />
      <SkeletonBlock className="h-32 w-full rounded-lg" />
    </div>
  );
}
