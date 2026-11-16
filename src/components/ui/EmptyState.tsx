import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Friendly empty state with an optional call-to-action. */
export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'ks-card flex flex-col items-center justify-center gap-3 px-6 py-14 text-center',
        className
      )}
    >
      {Icon && (
        <div
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-subtle text-muted"
          aria-hidden
        >
          <Icon className="h-7 w-7" />
        </div>
      )}
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {description && (
        <p className="max-w-sm text-xs leading-relaxed text-muted">
          {description}
        </p>
      )}
      {action && <div className="pt-2">{action}</div>}
    </div>
  );
}
