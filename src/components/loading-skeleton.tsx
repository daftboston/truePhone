import { cn } from "@/lib/utils";

type LoadingSkeletonProps = {
  className?: string;
};

export function LoadingSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn("bg-muted animate-pulse rounded-md", className)}
      aria-hidden
    />
  );
}

export function ListingCardSkeleton({ className }: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} aria-busy="true">
      <LoadingSkeleton className="aspect-[4/5] w-full rounded-xl" />
      <LoadingSkeleton className="h-4 w-3/4" />
      <LoadingSkeleton className="h-4 w-1/2" />
    </div>
  );
}
