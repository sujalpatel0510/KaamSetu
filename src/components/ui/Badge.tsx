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
  brand: 'bg-[#E8EFEA] text-[#163A35] border border-[#163A35]/20 dark:bg-[#1A2D28] dark:text-[#B7D86B] dark:border-[#B7D86B]/30',
  emerald: 'bg-green-500/10 text-green-700 dark:text-green-300 border border-green-500/25',
  amber: 'bg-[#C66A45]/10 text-[#C66A45] dark:text-[#D97E59] border border-[#C66A45]/25',
  red: 'bg-red-500/10 text-red-700 dark:text-red-300 border border-red-500/30',
  blue: 'bg-[#4678A8]/10 text-[#4678A8] dark:text-[#5B95CB] border border-[#4678A8]/25',
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
