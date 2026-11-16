import React from 'react';
import { cn } from '@/lib/cn';

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('ks-skeleton', className)} aria-hidden {...props} />;
}

/** Standard dashboard loading placeholder: banner + stat row + panel. */
export function DashboardSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="animate-fade-in space-y-6" role="status" aria-label="Loading">
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: cards }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );
}
