'use client';

import React, { useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export type StatTone = 'brand' | 'emerald' | 'amber' | 'red' | 'slate' | 'rose';

const toneIconClasses: Record<StatTone, string> = {
  brand: 'bg-[#E8EFEA] text-[#163A35] ring-[#163A35]/20 dark:bg-[#1A2D28] dark:text-[#B7D86B]',
  emerald: 'bg-green-500/10 text-green-700 dark:text-green-400 ring-green-500/20',
  amber: 'bg-[#C66A45]/10 text-[#C66A45] dark:text-[#D97E59] ring-[#C66A45]/20',
  red: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20',
  rose: 'bg-red-500/10 text-red-600 dark:text-red-400 ring-red-500/20',
  slate: 'bg-subtle text-ink-soft ring-line',
};

const toneValueClasses: Record<StatTone, string> = {
  brand: 'text-[#163A35] dark:text-[#B7D86B]',
  emerald: 'text-green-800 dark:text-green-300',
  amber: 'text-[#C66A45] dark:text-[#D97E59]',
  red: 'text-red-700 dark:text-red-300',
  rose: 'text-red-700 dark:text-red-300',
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
  value: number | string;
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
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value).replace(/[^0-9.-]+/g, '')) || 0;
  const animated = useAnimatedValue(numericValue);
  const display = typeof value === 'string' && isNaN(Number(value))
    ? value
    : currency
    ? `₹${Math.round(animated).toLocaleString('en-IN')}`
    : Math.round(animated).toLocaleString('en-IN');

  return (
    <div
      className={cn(
        'ks-card ks-card-hover flex items-start gap-3.5 sm:gap-4 p-4 sm:p-5 transition-all',
        className
      )}
    >
      {Icon && (
        <div
          className={cn(
            'flex h-10 w-10 sm:h-11 sm:w-11 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset shadow-xs',
            toneIconClasses[tone]
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p
          className="text-[11px] sm:text-xs font-bold tracking-wider text-muted uppercase leading-snug break-words"
          title={label}
        >
          {label}
        </p>
        <p
          className={cn(
            'mt-1 text-xl sm:text-2xl leading-tight font-black tracking-tight tabular-nums whitespace-nowrap',
            toneValueClasses[tone]
          )}
        >
          {display}
        </p>
        {hint && (
          <div className="mt-1.5 text-[11px] text-muted leading-tight line-clamp-2">
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}
