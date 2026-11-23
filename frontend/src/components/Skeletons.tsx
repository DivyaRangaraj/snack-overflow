interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return (
    <div className={`bg-gray-200 animate-pulse rounded ${className}`} />
  );
}

export function SnackCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border overflow-hidden">
      <Skeleton className="h-48 rounded-none" />
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <div className="flex justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="flex gap-2 pt-1">
          <Skeleton className="h-9 flex-1 rounded-xl" />
          <Skeleton className="h-9 w-9 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function KPICardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-border p-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 py-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-28" />
        </div>
      ))}
    </div>
  );
}
