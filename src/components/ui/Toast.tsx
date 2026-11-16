'use client';

import React, { useEffect, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';

type ToastKind = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

const TOAST_EVENT = 'kaamsetu:toast';
let nextId = 1;

function emit(kind: ToastKind, message: string) {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(TOAST_EVENT, { detail: { id: nextId++, kind, message } })
  );
}

export const toast = {
  success: (message: string) => emit('success', message),
  error: (message: string) => emit('error', message),
  info: (message: string) => emit('info', message),
};

const icons: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2 className="h-4.5 w-4.5 shrink-0 text-green-600 dark:text-green-400" aria-hidden />,
  error: <AlertCircle className="h-4.5 w-4.5 shrink-0 text-red-600 dark:text-red-400" aria-hidden />,
  info: <Info className="h-4.5 w-4.5 shrink-0 text-accent" aria-hidden />,
};

const accents: Record<ToastKind, string> = {
  success: 'border-s-green-500',
  error: 'border-s-red-500',
  info: 'border-s-accent',
};

/**
 * Global toast viewport. Mount once (root layout) and call `toast.success()` /
 * `toast.error()` / `toast.info()` from anywhere. Announced via aria-live.
 */
export default function ToastViewport() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<ToastItem>).detail;
      setItems((prev) => [...prev.slice(-3), detail]);
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== detail.id));
      }, 4200);
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, []);

  const dismiss = (id: number) =>
    setItems((prev) => prev.filter((t) => t.id !== id));

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="pointer-events-none fixed inset-x-4 bottom-20 z-100 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-4 sm:bottom-4 sm:items-end lg:bottom-6"
    >
      {items.map((t) => (
        <div
          key={t.id}
          role="status"
          className={cn(
            'ks-toast animate-fade-up border-s-2 max-w-sm',
            accents[t.kind]
          )}
        >
          {icons[t.kind]}
          <p className="flex-1 text-sm leading-snug text-ink">{t.message}</p>
          <button
            type="button"
            onClick={() => dismiss(t.id)}
            aria-label="Dismiss notification"
            className="rounded-md p-0.5 text-muted transition-colors hover:bg-hover hover:text-ink"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
