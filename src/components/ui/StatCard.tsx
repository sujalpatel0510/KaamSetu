'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type StatTone = 'brand' | 'emerald' | 'amber' | 'red' | 'slate';

const toneIconClasses: Record<StatTone, string> = {
  brand: 'bg-brand-50 text-accent ring-brand-200/70',
  emerald: 'bg-green-500/10 text-green-600 dark:text-green-400 ring-green-500/20',
  amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20',
  slate: 'bg-subtle text-ink-soft ring-line',
};

const toneValueClasses: Record<StatTone, string> = {
  brand: 'text-accent-strong',
  emerald: 'text-green-700 dark:text-green-300',
  amber: 'text-amber-700 dark:text-amber-300',
  red: 'text-red-700 dark:text-red-300',
  slate: 'text-ink',
};

/** Animated counter that respects prefers-reduced-motion. */
function useAnimatedValue(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const prefersReducedMotion = useRef(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;
    if (prefersReducedMotion.current) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

interface StatCardProps {
  icon?: LucideIcon;
  label: string;
  value: number;
  /** Render the number as currency (₹, Indian grouping). */
  currency?: boolean;
  hint?: React.ReactNode;
  tone?: StatTone;
  className?: string;
}

export default function StatCard({
  icon: Icon,
  label,
  value,
  currency = false,
  hint,
  tone = 'brand',
  className,
}: StatCardProps) {
  const animated = useAnimatedValue(value);
  const display = currency
    ? `₹${Math.round(animated).toLocaleString('en-IN')}`
    : Math.round(animated).toLocaleString('en-IN');

  return (
    <div
      className={cn(
        'ks-card ks-card-hover flex items-start gap-4 p-5',
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset',
            toneIconClasses[tone]
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold tracking-wider text-muted uppercase">
          {label}
        </p>
        <p
          className={cn(
            'mt-1 text-2xl leading-none font-black tracking-tight tabular-nums',
            toneValueClasses[tone]
          )}
        >
          {display}
        </p>
        {hint && <p className="mt-1.5 text-[11px] text-muted">{hint}</p>}
      </div>
    </div>
  );
}
