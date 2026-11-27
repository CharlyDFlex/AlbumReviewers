import { SkeletonBlock } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      <SkeletonBlock className="h-9 w-64 mb-2" />
      <SkeletonBlock className="h-4 w-40 mb-8" />
      <div className="grid grid-cols-2 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="px-3 sm:px-4">
            <SkeletonBlock className="aspect-square w-full" />
            <div className="shelf-plank mt-1 opacity-50" />
            <SkeletonBlock className="mt-2 h-4 w-3/4" />
          </div>
        ))}
      </div>
    </div>
  );
}
