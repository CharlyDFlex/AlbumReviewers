import { SkeletonBlock } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex flex-col gap-2">
          <SkeletonBlock className="h-8 w-72" />
          <SkeletonBlock className="h-4 w-96" />
        </div>
        <SkeletonBlock className="h-4 w-32" />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonBlock key={i} className="h-[72px] w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
