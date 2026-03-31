import { cn } from "@/lib/utils";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("bg-muted animate-pulse rounded-none", className)}
      aria-hidden
      {...props}
    />
  );
}

Skeleton.displayName = "Skeleton";

export { Skeleton };
