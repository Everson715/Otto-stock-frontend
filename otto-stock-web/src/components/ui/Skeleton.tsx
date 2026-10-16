interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = 'h-4 w-full' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-surface-container-high/80 rounded-md ${className}`}
      aria-hidden="true"
    />
  );
}
