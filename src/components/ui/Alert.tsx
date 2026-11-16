import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/cn';

export type AlertTone = 'success' | 'error' | 'warning' | 'info';

const toneConfig: Record<
  AlertTone,
  { classes: string; icon: React.ReactNode }
> = {
  success: {
    classes: 'border-green-500/25 bg-green-500/10 text-green-900 dark:text-green-300',
    icon: <CheckCircle2 className="h-4 w-4 shrink-0 text-green-600 dark:text-green-400" aria-hidden />,
  },
  error: {
    classes: 'border-red-500/30 bg-red-500/10 text-red-800 dark:text-red-300',
    icon: <AlertCircle className="h-4 w-4 shrink-0 text-red-500 dark:text-red-400" aria-hidden />,
  },
  warning: {
    classes: 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200',
    icon: <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" aria-hidden />,
  },
  info: {
    classes: 'border-brand-200 bg-brand-50 text-ink',
    icon: <Info className="h-4 w-4 shrink-0 text-accent" aria-hidden />,
  },
};

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  tone?: AlertTone;
  children: React.ReactNode;
}

/** Inline feedback banner for form results and system messages. */
export default function Alert({
  tone = 'info',
  className,
  children,
  ...props
}: AlertProps) {
  const cfg = toneConfig[tone];
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'animate-fade-in flex items-start gap-2.5 rounded-xl border p-3.5 text-xs font-medium',
        cfg.classes,
        className
      )}
      {...props}
    >
      {cfg.icon}
      <span className="leading-relaxed">{children}</span>
    </div>
  );
}
