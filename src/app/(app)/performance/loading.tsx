import { Skeleton } from "@/components/ui/skeleton";

export default function PerformanceLoading() {
  return (
    <div
      className="space-y-6"
      aria-busy="true"
      aria-label="Loading performance"
    >
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-9 w-full max-w-md" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <Skeleton className="h-40" />
      <div className="grid gap-4 xl:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    </div>
  );
}
