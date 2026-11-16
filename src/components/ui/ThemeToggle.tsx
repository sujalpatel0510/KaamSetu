'use client';

import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { cn } from '@/lib/cn';

interface ThemeToggleProps {
  className?: string;
}

/**
 * Light/dark theme switcher.
 * The initial theme is applied pre-paint by an inline script in the root
 * layout (localStorage `kaamsetu_theme`, falling back to system preference).
 * Icons are swapped purely with CSS dark: variants, so no hydration state
 * is needed for the icon itself.
 */
export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const toggle = () => {
    const root = document.documentElement;
    const next = !root.classList.contains('dark');
    // Enable a brief cross-fade of colors, then remove (see globals.css).
    root.classList.add('ks-theme-switching');
    root.classList.toggle('dark', next);
    try {
      localStorage.setItem('kaamsetu_theme', next ? 'dark' : 'light');
    } catch {
      /* private mode */
    }
    window.setTimeout(() => root.classList.remove('ks-theme-switching'), 350);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle dark mode"
      title="Toggle dark mode"
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface text-ink-soft transition-colors hover:bg-hover hover:text-ink',
        className
      )}
    >
      <Moon className="h-4 w-4 dark:hidden" aria-hidden />
      <Sun className="hidden h-4 w-4 dark:block" aria-hidden />
    </button>
  );
}
