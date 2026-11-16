import React from 'react';
import { cn } from '@/lib/cn';

export type BadgeTone =
  | 'neutral'
  | 'brand'
  | 'emerald'
  | 'amber'
  | 'red'
  | 'blue';

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-subtle text-ink-soft border border-line',
  brand: 'bg-brand-50 text-accent-strong border border-brand-200/70',
  emerald: 'bg-green-500/10 text-green-800 dark:text-green-300 border border-green-500/25/80',
  amber: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30',
  red: 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30/80',
  blue: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/25/80',
};

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: BadgeTone;
}

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span className={cn('ks-badge', toneClasses[tone], className)} {...props} />
  );
}

/* ── Domain status badges ─────────────────────────────────── */

export type ApplicationStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
export type JobStatus = 'OPEN' | 'FILLED' | 'CLOSED';
export type PaymentMethod = 'CASH' | 'UPI' | 'CREDIT';

const applicationConfig: Record<
  ApplicationStatus,
  { tone: BadgeTone; label: string }
> = {
  PENDING: { tone: 'amber', label: 'Under Review' },
  ACCEPTED: { tone: 'emerald', label: 'Accepted / Hired' },
  REJECTED: { tone: 'red', label: 'Not Selected' },
  WITHDRAWN: { tone: 'neutral', label: 'Withdrawn' },
};

export function ApplicationStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const cfg =
    applicationConfig[status as ApplicationStatus] ??
    ({ tone: 'neutral' as BadgeTone, label: status });
  return (
    <Badge tone={cfg.tone} className={className}>
      {cfg.label}
    </Badge>
  );
}

const jobStatusConfig: Record<JobStatus, { tone: BadgeTone; label: string }> = {
  OPEN: { tone: 'emerald', label: 'Open' },
  FILLED: { tone: 'blue', label: 'Filled' },
  CLOSED: { tone: 'neutral', label: 'Closed' },
};

export function JobStatusBadge({
  status,
  className,
}: {
  status: string;
  className?: string;
}) {
  const cfg =
    jobStatusConfig[status as JobStatus] ??
    ({ tone: 'neutral' as BadgeTone, label: status });
  return (
    <Badge tone={cfg.tone} className={className}>
      {cfg.label}
    </Badge>
  );
}

export function PaymentMethodBadge({
  method,
  className,
}: {
  method: string;
  className?: string;
}) {
  const tone: BadgeTone =
    method === 'CREDIT' ? 'amber' : method === 'UPI' ? 'blue' : 'emerald';
  const label = method === 'CREDIT' ? 'Udhaar' : method === 'UPI' ? 'UPI' : 'Cash';
  return (
    <Badge tone={tone} className={className}>
      {label}
    </Badge>
  );
}

export default Badge;
