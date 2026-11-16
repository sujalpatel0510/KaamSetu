'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant =
  | 'primary'
  | 'accent'
  | 'secondary'
  | 'ghost'
  | 'danger'
  | 'danger-soft'
  | 'emerald'
  | 'amber';

export type ButtonSize = 'sm' | 'md' | 'lg';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'ks-btn-primary',
  accent: 'ks-btn-accent',
  secondary: 'ks-btn-secondary',
  ghost: 'ks-btn-ghost',
  danger: 'ks-btn-danger',
  'danger-soft': 'ks-btn-danger-soft',
  emerald: 'ks-btn-emerald',
  amber: 'ks-btn-amber',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'ks-btn-sm',
  md: 'ks-btn-md',
  lg: 'ks-btn-lg',
};

/** Class helper so `next/link` elements can look identical to buttons. */
export function buttonClasses(
  variant: ButtonVariant = 'primary',
  size: ButtonSize = 'md',
  className?: string
) {
  return cn('ks-btn', variantClasses[variant], sizeClasses[size], className);
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  loadingText?: string;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  loadingText,
  className,
  children,
  disabled,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={buttonClasses(variant, size, className)}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {loading && loadingText ? loadingText : children}
    </button>
  );
}
